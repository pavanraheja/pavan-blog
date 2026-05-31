#!/usr/bin/env python3
"""publish.py — direct-API posting to X / LinkedIn / Instagram.

Usage:
  python3 publish.py x --whoami
  python3 publish.py x --dry-run "Hello world"
  python3 publish.py x "Real tweet"
  python3 publish.py x --thread "1/" "2/" "3/"
  python3 publish.py x --dry-run --thread "1/" "2/"
"""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
import json
import os
import pathlib
import sys

SECRETS = pathlib.Path.home() / ".config" / "pavan-social" / ".env"
LOG_DIR = pathlib.Path.home() / ".local" / "share" / "pavan-social"
LOG_FILE = LOG_DIR / "posts.jsonl"


def load_env() -> dict:
    if not SECRETS.exists():
        sys.exit(f"missing secrets file: {SECRETS}")
    env: dict[str, str] = {}
    for raw in SECRETS.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, _, v = line.partition("=")
        env[k.strip()] = v.strip()
    return env


def log(entry: dict) -> None:
    LOG_DIR.mkdir(parents=True, exist_ok=True)
    entry = {"at": datetime.now(timezone.utc).isoformat(), **entry}
    with LOG_FILE.open("a") as f:
        f.write(json.dumps(entry) + "\n")


def cmd_x(args: argparse.Namespace) -> int:
    from platforms import x  # local import keeps CLI snappy

    env = load_env()
    needed = ["X_API_KEY", "X_API_KEY_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET"]
    missing = [k for k in needed if not env.get(k)]
    if missing:
        sys.exit(f"missing X creds: {missing}")

    if args.whoami:
        me = x.whoami(env)
        print(json.dumps(me, indent=2))
        log({"platform": "x", "action": "whoami", "result": me})
        return 0

    if args.thread:
        texts = args.text
        for i, t in enumerate(texts, 1):
            print(f"  [{i}/{len(texts)}] ({len(t)} chars) {t}")
        if args.dry_run:
            print("\nDRY RUN — not posted.")
            log({"platform": "x", "action": "thread", "dry_run": True, "texts": texts})
            return 0
        results = x.post_thread(env, texts)
        urls = [f"https://x.com/pavanraheja/status/{r['id']}" for r in results]
        print("\nposted:")
        for u in urls:
            print(f"  {u}")
        log({"platform": "x", "action": "thread", "dry_run": False, "texts": texts, "ids": [r["id"] for r in results]})
        return 0

    text = " ".join(args.text)
    if not text:
        sys.exit("nothing to post")
    print(f"({len(text)} chars) {text}")
    if args.dry_run:
        print("\nDRY RUN — not posted.")
        log({"platform": "x", "action": "post", "dry_run": True, "text": text})
        return 0
    res = x.post(env, text)
    url = f"https://x.com/pavanraheja/status/{res['id']}"
    print(f"\nposted: {url}")
    log({"platform": "x", "action": "post", "dry_run": False, "text": text, "id": res["id"]})
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(prog="publish")
    sub = parser.add_subparsers(dest="platform", required=True)

    px = sub.add_parser("x", help="post to X (Twitter)")
    px.add_argument("--dry-run", action="store_true", help="print what would post, don't send")
    px.add_argument("--whoami", action="store_true", help="verify auth, print account info")
    px.add_argument("--thread", action="store_true", help="treat text args as thread items")
    px.add_argument("text", nargs="*", help="tweet text (single arg) or thread items (with --thread)")

    args = parser.parse_args()
    if args.platform == "x":
        return cmd_x(args)
    return 1


if __name__ == "__main__":
    sys.path.insert(0, str(pathlib.Path(__file__).parent))
    raise SystemExit(main())
