# Project Status

This file is the current execution snapshot for the ADR Bot landing project.

## Done

### Site / Product

- Main landing is live on [https://www.adr-bot.de](https://www.adr-bot.de)
- Telegram CTA and redirect flow are implemented
- Bing verification meta tag is in place

### Analytics

- Server-side analytics capture is implemented
- Export endpoints are live:
  - `/api/analytics/export.csv`
  - `/api/analytics/export.json`
- n8n Data Table sink is configured as the preferred production sink
- Google Sheets bridge works
- In practice, Google Sheets is more reliable via Apps Script than plain `IMPORTDATA`

### Google Search Console

- Property access is set up
- Google Search Console API is enabled
- Google Cloud service account exists for SEO analysis
- Service account has Search Console access
- Real query/page data can be fetched programmatically

Observed early signals:

- Query: `adr prüfungsfragen app deutsch`
- Query: `adr bot`
- Existing page impressions seen for `/`, `/adr-pruefung-auf-deutsch`, `/ru`, preview pages

### SEO

Three SEO landing-page clusters have been created and pushed to production.

Current public SEO paths:

- `/adr-pruefung-auf-deutsch`
- `/adr-begriffe`
- `/adr-faq-fuer-fahrer`
- `/technisches-deutsch-adr`
- `/gefahrgut-deutsch-lernen`
- `/adr-vorbereitung-fuer-lkw-fahrer`
- `/adr-pruefung-fuer-nicht-muttersprachler`
- `/adr-fragen-und-antworten`
- `/adr-pruefungsfragen-app-deutsch`
- `/adr-fragen-auf-deutsch`
- `/adr-fachbegriffe-deutsch`
- `/adr-deutsch-fuer-lkw-fahrer`
- `/adr-pruefung-deutsch-lernen`
- `/gefahrgut-pruefung-auf-deutsch`
- `/adr-app-fuer-auslaender`
- `/adr-telegram-bot-deutsch`
- `/adr-pruefungsfragen-lernen`
- `/adr-test-deutsch`
- `/adr-fragebogen-deutsch`
- `/adr-kurs-deutsch`
- `/adr-schein-deutsch`
- `/adr-pruefung-hilfe`
- `/adr-deutsch-ueben`

Relevant production commits:

- `c952970 Add ADR SEO landing pages`
- `adc3053 Add second ADR SEO landing page cluster`
- `62fdede Add third ADR SEO landing page cluster`

### TikTok Setup

- TikTok Studio access confirmed
- TikTok developer organization/app created
- Domain verification completed
- `Login Kit` added
- `Content Posting API` added
- Redirect URI defined:
  - `https://www.adr-bot.de/api/tiktok/callback`

## In Progress

### SEO Growth

- Continue using Search Console data to decide next long-tail clusters
- Expand beyond current three clusters carefully, without creating thin or duplicate pages
- Monitor which landing pages actually start earning impressions and clicks

### Image Generation — Flux AI upgrade (done 2026-04-22)

- Default model switched from `fal-ai/flux/dev` → `fal-ai/flux-realism` (photorealism LoRA, better skin/material detail)
- `num_inference_steps` raised 28 → 35 (sharper output)
- `guidance_scale: 3.5` added (better prompt adherence)
- Model endpoint now overridable via `FAL_AI_MODEL_URL` env var without touching code

### Measurement Quality

- Verify whether Telegram bot-side counting is missing, delayed, or genuinely low
- Compare site-side `telegram_redirect` counts vs actual bot starts

## Not Done Yet

### TikTok Automation

- Real TikTok auth/posting flow is not implemented yet
- No end-to-end TikTok posting demo exists yet
- TikTok app review has not been submitted successfully
- TikTok direct posting is intentionally not enabled yet

### Search / Indexation

- Google has not had enough time to fully crawl and rank the new SEO clusters
- Most new pages are too fresh to judge by outcome yet

### Polish / Cleanup

- ~~Duplicate `| ADR Bot` suffix in page titles~~ — fixed (2026-04-22): all pages with `| ADR Bot` in their title now use `{ absolute: "..." }` metadata so Next.js template doesn't append a second suffix. Affected: all SEO pages (`buildSeoPageMetadata`), `/ru`, `/impressum`, `/datenschutz`, `/legal`.
- Project documentation was previously behind reality and is now being normalized
- Sensitive local keys exist outside Git and must stay outside Git

## Credentials & OAuth Setup (done 2026-04-22)

### Google Search Console — Service Account Key

A new JSON key was generated for the `adr-search-console` service account and downloaded to:

```text
~/Downloads/adr-trainer-985f953b2852.json
```

- **Service account:** `adr-search-console@adr-trainer.iam.gserviceaccount.com`
- **Project:** `adr-trainer`
- **Key ID:** `985f953b2852eaa5a3ed900f3aaae5bd728c8dc7`

**What Codex needs to do with this:**

1. ~~Copy the JSON file to a safe location on VPS (e.g. `/root/secrets/gsc-service-account.json`) — never commit it to git~~
   - done on `2026-04-22`:
     - `/root/secrets/gsc-service-account.json`
2. ~~Update `run-intent-signal-snapshot.mjs` (or `intent-signal-sources.mjs`) to support service account auth instead of `GSC_ACCESS_TOKEN` — use `google-auth-library` to exchange the JSON key for a Bearer token automatically~~
   - done on `2026-04-22`:
     - `scripts/runtime/gsc-auth.mjs`
     - `scripts/runtime/intent-signal-sources.mjs`
     - `scripts/run-intent-signal-snapshot.mjs`
     - `scripts/check-search-console-indexing.mjs`
3. ~~Add `GSC_SERVICE_ACCOUNT_KEY_PATH=/root/secrets/gsc-service-account.json` and `GSC_SITE_URL=https://www.adr-bot.de/` to the server `.env`~~
   - done on `2026-04-22` in server `.env.local`

The service account already has Search Console access (configured previously). No browser OAuth flow needed — the key file is sufficient for fully automated operation.

Practical status now:

- the project no longer depends on the MacBook `Downloads` folder for this key;
- the server now has both env wiring and service-account auth support;
- confirmed VPS smoke run:
  - `intent-signal-runs/gsc-service-account-smoke-2`
  - `analytics_count = 41`
  - `search_console_count = 2`

### YouTube Upload & Google Drive — VPS credentials configured (2026-04-22)

Both OAuth credentials were manually authorized through the self-hosted n8n UI on the VPS via an SSH tunnel.

- **YouTube OAuth2 API** — connected and working on VPS
- **Google Drive OAuth2 API** — connected and working on VPS

Sensitive login data, API keys, and OAuth client details are intentionally kept out of Git and must remain only in the secure server/runtime setup.

YouTube upload already works via the **n8n "ADR YouTube Execution Bridge"** workflow on VPS.

The pipeline step that triggers YouTube upload is `run-package-youtube-publish.mjs` — it posts to the n8n webhook and polls for result.

### Content Pipeline — Post-Render Automation (done 2026-04-22)

The missing automation link has been implemented:

- **`scripts/run-post-render-pipeline.mjs`** — standalone wrapper that chains Shotstack → finalize → YouTube publish.
  - Takes `--packages-root <dir>` (same as dispatch's `output_dir`)
  - Reads env vars `SHOTSTACK_API_KEY` and `N8N_API_KEY` automatically
  - Use `--skip-youtube` to stop after finalize (useful for testing renders)

- **`run-daily-content-dispatch.mjs`** — now accepts `--full-pipeline` flag.
  - When passed for QUESTION or WORD types, automatically chains `run-post-render-pipeline.mjs` after render package generation

**Full end-to-end command:**

```bash
node scripts/run-daily-content-dispatch.mjs --decision <decision.json> --full-pipeline
```

**Standalone post-render (if dispatch already ran):**

```bash
node scripts/run-post-render-pipeline.mjs --packages-root <dispatch-output-dir>
```

## Operational Notes

- Do not commit live credentials or service-account JSON files
- Verify production directly on `adr-bot.de` when checking deploy outcomes
- Prefer narrow, high-intent German long-tail pages over broad generic ADR terms
