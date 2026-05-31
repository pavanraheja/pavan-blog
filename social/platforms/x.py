"""X (Twitter) posting via OAuth 1.0a User Context."""
from __future__ import annotations
from requests_oauthlib import OAuth1Session

API_BASE = "https://api.x.com/2"
TWEET_MAX = 280


def _session(env: dict) -> OAuth1Session:
    return OAuth1Session(
        env["X_API_KEY"],
        client_secret=env["X_API_KEY_SECRET"],
        resource_owner_key=env["X_ACCESS_TOKEN"],
        resource_owner_secret=env["X_ACCESS_TOKEN_SECRET"],
    )


def whoami(env: dict) -> dict:
    r = _session(env).get(f"{API_BASE}/users/me")
    r.raise_for_status()
    return r.json()["data"]


def post(env: dict, text: str, in_reply_to: str | None = None) -> dict:
    if len(text) > TWEET_MAX:
        raise ValueError(f"Tweet exceeds {TWEET_MAX} chars: {len(text)}")
    body: dict = {"text": text}
    if in_reply_to:
        body["reply"] = {"in_reply_to_tweet_id": in_reply_to}
    r = _session(env).post(f"{API_BASE}/tweets", json=body)
    if r.status_code >= 400:
        raise RuntimeError(f"X API error {r.status_code}: {r.text}")
    return r.json()["data"]


def post_thread(env: dict, texts: list[str]) -> list[dict]:
    over = [(i, len(t)) for i, t in enumerate(texts) if len(t) > TWEET_MAX]
    if over:
        raise ValueError(f"Tweets exceed {TWEET_MAX} chars at indices: {over}")
    results: list[dict] = []
    last_id: str | None = None
    for t in texts:
        res = post(env, t, in_reply_to=last_id)
        results.append(res)
        last_id = res["id"]
    return results
