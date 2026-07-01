import asyncio
import html
import json
import os
import re

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Reeds Jobs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

GREENHOUSE_BOARDS = [
    "riskified",
    "fireblocks",
    "pagayais",
    "gongio",
    "lightricks",
    "similarweb",
    "melio",
    "wizinc",
    "yotpo",
    "catonetworks",
]
GREENHOUSE_URL = "https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true"

GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}"
RANK_BATCH_SIZE = 40
RANK_MAX_CONCURRENCY = 5
RANK_DESCRIPTION_CHARS = 500

_TAG_RE = re.compile(r"<[^>]+>")


def strip_html(raw: str) -> str:
    """Strip HTML tags from Greenhouse job content, leaving plain text."""
    text = _TAG_RE.sub(" ", raw or "")
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()


async def fetch_board(client: httpx.AsyncClient, token: str) -> list[dict]:
    """Fetch all jobs for a single Greenhouse board and tag them with the company."""
    response = await client.get(GREENHOUSE_URL.format(token=token))
    response.raise_for_status()
    data = response.json()
    jobs = []
    for job in data.get("jobs", []):
        location = job.get("location") or {}
        jobs.append(
            {
                "title": job.get("title"),
                "location": location.get("name"),
                "apply_url": job.get("absolute_url"),
                "company": token,
                "description": strip_html(job.get("content", "")),
            }
        )
    return jobs


async def fetch_all_jobs() -> list[dict]:
    """Fetch jobs from all configured Greenhouse boards concurrently and combine them."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        results = await asyncio.gather(
            *(fetch_board(client, token) for token in GREENHOUSE_BOARDS),
            return_exceptions=True,
        )

    jobs: list[dict] = []
    for token, result in zip(GREENHOUSE_BOARDS, results):
        if isinstance(result, Exception):
            raise HTTPException(
                status_code=502,
                detail=f"Failed to fetch jobs for board '{token}': {result}",
            )
        jobs.extend(result)
    return jobs


@app.get("/jobs")
async def get_jobs() -> dict:
    """Fetch jobs from all configured Greenhouse boards concurrently and combine them."""
    jobs = await fetch_all_jobs()
    slim_jobs = [
        {
            "title": job["title"],
            "location": job["location"],
            "apply_url": job["apply_url"],
            "company": job["company"],
        }
        for job in jobs
    ]
    return {"count": len(slim_jobs), "jobs": slim_jobs}


class RankRequest(BaseModel):
    cv: str
    role: str


def _chunks(items: list, size: int):
    for i in range(0, len(items), size):
        yield items[i : i + size]


def _build_rank_prompt(cv: str, role: str, jobs_batch: list[dict]) -> str:
    listing = json.dumps(
        [
            {
                "id": job["id"],
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "description": (job.get("description") or "")[:RANK_DESCRIPTION_CHARS],
            }
            for job in jobs_batch
        ]
    )
    return (
        "You are a recruiting assistant. Score how well each job posting fits the "
        "candidate's CV and target role, from 0 (poor fit) to 100 (excellent fit), "
        "and give a short one-sentence reason for each score.\n\n"
        f"Target role: {role}\n\n"
        f"Candidate CV:\n{cv}\n\n"
        f"Job postings (JSON array):\n{listing}\n\n"
        "Respond ONLY with a JSON array with exactly one object per job id, in this "
        'exact shape: [{"id": <id>, "score": <integer 0-100>, "reason": "<short reason>"}]. '
        "Do not include any text outside the JSON array."
    )


async def _score_batch(
    client: httpx.AsyncClient,
    semaphore: asyncio.Semaphore,
    api_key: str,
    cv: str,
    role: str,
    jobs_batch: list[dict],
) -> list[dict]:
    prompt = _build_rank_prompt(cv, role, jobs_batch)
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.2},
    }
    url = GEMINI_URL.format(model=GEMINI_MODEL, api_key=api_key)

    async with semaphore:
        response = await client.post(url, json=body)
    response.raise_for_status()
    data = response.json()

    try:
        text = data["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError) as exc:
        raise ValueError(f"Unexpected Gemini response shape: {data}") from exc

    text = text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]

    return json.loads(text)


@app.post("/rank")
async def rank_jobs(request: RankRequest) -> dict:
    """Rank all fetched jobs against a candidate's CV and target role using Gemini."""
    if not request.cv.strip():
        raise HTTPException(status_code=400, detail="cv must not be empty.")
    if not request.role.strip():
        raise HTTPException(status_code=400, detail="role must not be empty.")

    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GEMINI_API_KEY environment variable is not set.",
        )

    jobs = await fetch_all_jobs()
    for index, job in enumerate(jobs):
        job["id"] = index

    semaphore = asyncio.Semaphore(RANK_MAX_CONCURRENCY)
    async with httpx.AsyncClient(timeout=60.0) as client:
        batch_results = await asyncio.gather(
            *(
                _score_batch(client, semaphore, api_key, request.cv, request.role, batch)
                for batch in _chunks(jobs, RANK_BATCH_SIZE)
            ),
            return_exceptions=True,
        )

    scores: dict[int, dict] = {}
    for batch_result in batch_results:
        if isinstance(batch_result, Exception):
            raise HTTPException(
                status_code=502,
                detail=f"Gemini scoring failed: {batch_result}",
            )
        for entry in batch_result:
            try:
                job_id = int(entry.get("id"))
            except (TypeError, ValueError):
                continue
            scores[job_id] = entry

    ranked = []
    for job in jobs:
        entry = scores.get(job["id"], {})
        ranked.append(
            {
                "title": job.get("title"),
                "company": job.get("company"),
                "location": job.get("location"),
                "apply_url": job.get("apply_url"),
                "score": entry.get("score", 0),
                "reason": entry.get("reason", "Scoring unavailable for this job."),
            }
        )

    ranked.sort(key=lambda j: j["score"], reverse=True)
    return {"role": request.role, "count": len(ranked), "jobs": ranked}
