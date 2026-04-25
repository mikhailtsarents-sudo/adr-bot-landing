# Project Status

This file is the current execution snapshot for the ADR Bot landing project.

## Done

### Site / Product

- Main landing is live on [https://www.adr-bot.de](https://www.adr-bot.de)
- Telegram CTA and redirect flow are implemented
- Bing verification meta tag is in place
- New landing conversion pass is now prepared locally on `2026-04-24`:
  - stronger language-barrier hero
  - `Basiskurs / Tank / Begriffe` path selection
  - focused `QUESTION + WORD` product proof
  - explicit `free start` vs `full access`
  - visible trust/disclaimer and short FAQ
  - low-friction final Telegram CTA
- Local landing files for this pass:
  - `src/components/landing/landing-copy.ts`
  - `src/components/landing/landing-page.tsx`
  - `src/components/landing/phone-carousel.tsx`
  - `src/app/page.tsx`
  - `src/app/ru/page.tsx`
- Local validation passed:
  - `npx tsc --noEmit`
- Deploy state:
  - ready for the next bounded Vercel deploy
  - not yet confirmed live from this side

### Analytics

- Server-side analytics capture is implemented
- Export endpoints are live:
  - `/api/analytics/export.csv`
  - `/api/analytics/export.json`
- Dashboard summary endpoint is now implemented:
  - `/api/analytics/dashboard.json`
- Bot funnel summary endpoint is now also implemented:
  - `/api/analytics/bot-funnel.json`
- n8n Data Table sink is configured as the preferred production sink
- Google Sheets bridge works
- In practice, Google Sheets is more reliable via Apps Script than plain `IMPORTDATA`
- The dashboard layer now exposes:
  - `today`
  - `7 days`
  - `30 days`
  - 30d funnel summary
  - top sources / pages / page types
  - latest events and latest Telegram redirects
- Live on `2026-04-24`:
  - YouTube-bound render packages now append a tracked Telegram deep-link into the description
  - token format:
    - `yt--shorts--<render_task_id>`
  - this is the new handoff for future `YouTube -> Bot` attribution
  - bot funnel events also have a dedicated dashboard path now, not only storage
- Local referral hardening follow-up prepared on `2026-04-25`:
  - `src/lib/bot-funnel-dashboard.ts` now adds richer referral summary slices:
    - `offer_views`
    - `unlock_clicks`
    - `counted_screens`
    - `duplicate_screens`
    - `top_referrers_30d`
    - `rejection_reasons_30d`
    - `grant_variants_30d`
  - practical goal:
    - turn referral from “visible but vague” into a real operator-readable growth channel
  - deploy state:
    - ready for next bounded Vercel deploy

### Content Catalogs

- VPS live `WORD` catalog now uses:
  - `examples/word-batch-wave-1`
  - `174` active entries
- Live `QUESTION` catalog now contains:
  - `141` questions

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
- `/adr-pruefung-bestehen`
- `/adr-gefahrgut-symbole-deutsch`
- `/adr-klassen-deutsch`
- `/adr-wiederholung-deutsch`
- `/adr-lernhilfe-deutsch`

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

### SEO Growth — SEO Autopilot done (2026-04-22)

`run-seo-autopilot-cycle.mjs` is now complete. It chains:
1. `run-seo-page-refresh.mjs` — updates copy in `seo-pages.ts` for up to 3 existing pages
2. `run-seo-page-create.mjs` — creates up to 1 new page (config + `page.tsx`)
3. `git add src/lib/seo-pages.ts src/app/` → `git commit` → `git push origin main` → Vercel auto-deploys

Dry-run confirmed working. Live test with `--skip-git` applied 3 pages successfully.

To run on VPS (after `git pull`):
```
node scripts/run-seo-autopilot-cycle.mjs
```

- Monitor which landing pages earn impressions and clicks via [[📡 Google Search Console]]
- VPS needs git push credentials configured for the full automated loop

### SEO Winner Audit — reproducible audit layer added (2026-04-25)

A deep winner-page audit is no longer just a manual one-off review.

New local script:

```bash
npm run run:seo-page-audit
```

It now generates:

- `reports/<slug>/seo_page_audit.json`
- `reports/<slug>/seo_page_audit.md`

Current audit checks:

- top pages by 30d views
- top pages by 30d redirects
- overlap / cannibalization pairs
- thin or weak pages
- FAQ gaps
- internal linking gaps
- Search Console winners when local/server GSC auth exists

First local result on `2026-04-25`:

- `30` SEO pages audited
- analytics rows available:
  - `33`
- Search Console rows:
  - `0`
- local blocker:
  - no local `GSC_ACCESS_TOKEN` or `GSC_SERVICE_ACCOUNT_KEY_PATH`

Main current findings:

- measurable 30d traffic is still concentrated almost entirely in:
  - `/adr-pruefung-auf-deutsch`
  - `/adr-begriffe`
- strongest remaining overlap pairs now include:
  - `/adr-pruefung-auf-deutsch` <-> `/adr-pruefung-deutsch-lernen`
  - `/adr-kurs-deutsch` <-> `/adr-schein-deutsch`
  - `/adr-telegram-bot-deutsch` <-> `/adr-lernhilfe-deutsch`
- biggest remaining page-quality debt now is:
  - thin FAQ depth on many pages
  - overly generic hub-heavy related links on many pages
  - very little real traffic yet on most newly created SEO pages

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

## Claude Code SSH Access (done 2026-04-23)

SSH key for Claude Code autonomous VPS access is configured:

- **Key file (local):** `~/.ssh/adr_vps_key`
- **Authorized key on VPS:** `/root/.ssh/authorized_keys`
- **Connection:** `ssh -i ~/.ssh/adr_vps_key root@46.225.170.55`

Claude Code can now run commands on the VPS directly without going through the Hetzner KVM console.

## Operational Notes

- Do not commit live credentials or service-account JSON files
- Verify production directly on `adr-bot.de` when checking deploy outcomes
- Prefer narrow, high-intent German long-tail pages over broad generic ADR terms
- Claude Code SSH key: `~/.ssh/adr_vps_key` — do not delete

## Bot Funnel Operator Panel — prepared locally (2026-04-25)

The next readability upgrade is now prepared locally:

- `src/lib/bot-funnel-dashboard.ts` now builds explicit bot-funnel period buckets for:
  - `today`
  - `days_7`
  - `days_30`
- each period now includes:
  - `/start`
  - `course_selected`
  - `first_actions`
  - `learning_actions`
  - `buy_intent`
  - referral granted / rejected
  - start-to-action and start-to-buy rates

This is meant to remove the remaining “half-ready” readable summary behavior where the sheet still had placeholder strings like:

- `отдельного daily-блока пока нет`
- `смотри блок ниже`

The matching Google Apps Script refresh file was also upgraded locally so the top sheet summary can read as one funnel:

- `site views -> CTA -> redirects -> bot /start -> first action -> buy intent`

Local verification:

- `npx tsc --noEmit`

Status:

- ready for bounded Vercel + Apps Script deploy
- not yet live-confirmed from this side
