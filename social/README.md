# pavan-social — direct-API posting infra

Post to X / LinkedIn / Instagram via each platform's REST API, no third-party scheduler. Designed for both newsletter distribution and ad-hoc one-off posts.

## Layout

```
social/
  publish.py                  CLI entry point
  platforms/
    x.py                      X (Twitter) — OAuth 1.0a User Context
    linkedin.py               (pending)
    instagram.py              (pending)
  requirements.txt
```

## Secrets

All credentials live in `~/.config/pavan-social/.env` (chmod 600, outside any git repo). Never committed. See that file for which keys are populated.

## Logs

Every post (including dry-runs) is appended to `~/.local/share/pavan-social/posts.jsonl`. Tail with `jq .` for a clean read.

## Install

```sh
pip3 install -r requirements.txt
```

## Usage

```sh
# Dry-run a tweet (default — prints what would post, doesn't actually send)
python3 publish.py x --dry-run "Hello world from the API"

# Real tweet
python3 publish.py x "Real tweet text"

# Thread (each arg becomes one tweet, replies threaded automatically)
python3 publish.py x --thread "Tweet 1" "Tweet 2" "Tweet 3"

# Verify auth without posting
python3 publish.py x --whoami
```

## Conventions

- X: 280 chars/tweet, threads break across multiple. CLI errors out if any single tweet exceeds 280.
- All posts logged with timestamp, platform, text, response, dry-run flag.
- Rate limits not enforced in code yet — X free tier = 50/day, 500/month.
