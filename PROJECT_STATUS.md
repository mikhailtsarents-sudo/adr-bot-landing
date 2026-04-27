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
- `adr-ingest` on VPS is the preferred production sink
- canonical raw storage is VPS Postgres table:
  - `adr_site_analytics_events`
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
- Runtime health snapshot layer added on `2026-04-25`:
  - script:
    - `scripts/run-runtime-health-snapshot.mjs`
  - npm entry:
    - `npm run run:runtime-health-snapshot`
  - it now verifies:
    - public analytics dashboards
    - private ingest reads
    - VPS service/log freshness in full mode
    - Telegram webhook alignment in full mode
  - practical meaning:
    - operator can now get one bounded machine-readable + Markdown health snapshot instead of guessing from separate logs and endpoints
- 2026-04-26: runtime health alerting is now closed as a live VPS layer.
  - runtime health script now also writes:
    - `alerting.severity`
    - `alerting.alert_needed`
    - `alerting.recommended_actions`
    - stable latest copies under:
      - `runtime-health-runs/latest/`
    - backup / recovery freshness checks for:
      - latest backup manifest
      - latest restore smoke report
  - CLI now also supports:
    - `--fail-on-status fail`
  - live VPS wrapper/timer installed:
    - `/usr/local/bin/adr-runtime-health.sh`
    - `adr-runtime-health.service`
    - `adr-runtime-health.timer`
  - first live run immediately caught a real drift:
    - Telegram webhook had fallen back to Railway
  - webhook was then corrected back to:
    - `https://46.225.170.55:8443/telegram-webhook`
  - follow-up live snapshot turned fully green
  - practical meaning:
    - runtime health is no longer just a passive snapshot tool
    - it is now an active VPS alerting layer that can catch and surface real production drift
- 2026-04-26: runtime health operator visibility is now also exposed through the analytics layer.
  - new private ingest endpoint:
    - `/v1/runtime-health/latest`
  - new landing route:
    - `/api/analytics/runtime-health.json`
  - route behavior:
    - reads latest VPS runtime-health snapshot from `adr-ingest`
    - exposes sanitized operator-facing summary:
      - overall status
      - alerting headline / severity / recommended actions
      - grouped area status for:
        - services
        - logs
        - backup
        - webhook
        - ingest
        - public dashboards
  - practical meaning:
    - runtime health is now visible as a proper machine-readable operator surface, not only as local VPS files
- 2026-04-26: the repo Apps Script readable-summary layer was also extended for runtime health.
  - file:
    - `google-apps-script/readable_summary_refresh.gs`
  - it now fetches:
    - `/api/analytics/runtime-health.json`
  - and renders a dedicated runtime health block for the human-readable sheet summary
  - current reality:
    - repo version is ready
    - live Google Apps Script editor still needs a manual sync if we want the new block to appear in the current sheet immediately
- 2026-04-26: monetization funnel visibility was tightened.
  - practical gap fixed:
    - `limit_offer_view`
    - `limit_referral_click`
    - `limit_later_click`
    were previously only local/debug signals, not canonical bot-funnel events
  - `adr-trainer-bot` now emits these as passive funnel events into VPS analytics
  - `src/lib/bot-funnel-dashboard.ts` now also exposes:
    - `monetization_30d`
  - the new summary includes:
    - limit offer views
    - full-access offer opens
    - buy-intent clicks
    - referral-path clicks
    - continue-later clicks
    - referral-offer views
    - referral-unlock clicks
    - referral grant/reject counts
    - user-based rates from limit and referral screens
    - top limit reasons
    - referral offer variants
  - practical meaning:
    - paywall/referral is now measurable as a real funnel instead of a partially invisible local flow
- 2026-04-26: monetization diagnosis layer was added on top of the raw funnel.
  - `src/lib/bot-funnel-dashboard.ts` now also exposes:
    - `monetization_diagnosis_30d`
  - diagnosis now highlights:
    - users who saw the limit
    - users who acted from the limit screen
    - users who did nothing after the limit screen
    - users stuck on referral offer without unlock confirmation
    - users still unresolved after unlock confirmation
    - top loss stage
    - recommended focus
  - practical meaning:
    - the operator layer now tells us where monetization leaks the most instead of forcing manual comparison of many counters

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
  - many pages still rely on fallback FAQ logic instead of stronger manual FAQ authoring
  - effective related-link weakness now remains mainly on:
    - `/technisches-deutsch-adr`
    - `/gefahrgut-deutsch-lernen`
  - very little real traffic yet on most newly created SEO pages

Follow-up impact pass on `2026-04-25` improved this further:

- targeted overlap cleanup applied to:
  - `/adr-pruefung-auf-deutsch`
  - `/adr-pruefung-deutsch-lernen`
  - `/adr-pruefung-hilfe`
  - `/adr-test-deutsch`
  - `/adr-kurs-deutsch`
  - `/adr-schein-deutsch`
  - `/adr-telegram-bot-deutsch`
  - `/adr-lernhilfe-deutsch`
- targeted cluster-linking polish applied to:
  - `/technisches-deutsch-adr`
  - `/gefahrgut-deutsch-lernen`
- final local audit after the pass:
  - no internal linking gaps remain
  - the former top overlap around `/adr-pruefung-auf-deutsch` and `/adr-pruefung-deutsch-lernen` is no longer leading the report
  - residual overlaps are now mostly lower-priority cluster similarities plus the expected lack of real Search Console data in local runtime

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

- TikTok OAuth2 + PKCE flow implemented and completed (2026-04-26)
  - Token saved to `runtime/tiktok-auth/oauth-token.json` on VPS
  - Scope: `video.upload` (INBOX_UPLOAD mode active)
- End-to-end INBOX_UPLOAD confirmed working: `tiktok_sent_to_inbox`
  - publish_id: `v_inbox_file~v2.7633067962769131523`
- Pipeline integration: TikTok publish runs as Step 4 in `run-post-render-pipeline.mjs`
  - Triggered automatically when `TIKTOK_OAUTH_TOKEN_PATH` env var is set
  - TikTok failure is non-fatal (wrapped in try/catch, YouTube publish not aborted)
- TikTok App Review: demo video recorded, pending upload + submit
  - Blocked: `spam_risk_too_many_pending_share` (daily INBOX limit hit during testing)
  - Retry tomorrow with fresh daily limit
- TikTok direct posting (`DIRECT_PRIVATE`) blocked until App Review approved
  - `video.publish` scope not available in sandbox yet
- Client secret was exposed in screenshots — rotate before production use

### Content Diversity

- WORD pipeline fix deployed (2026-04-26):
  - `DEFAULT_WORD_DIR` was pointing to `examples/` (1 word)
  - Now points to `examples/word-batch-wave-1/` (174 words)
  - Affected files: `scripts/run-word-content-creator.mjs`, `scripts/run-shorts-decider-cycle.mjs`
  - Commit: `7ba0133`
  - Action needed: `git pull` on VPS so next decider cycle picks WORD content
- NEWS: 1 news item in prepared queue (`draft-1776895259492`), needs regular news flow

### Video Quality

- **Horizontal stripe FIXED (2026-04-26)**: Root cause was two bugs in `scripts/render/caption-styles.mjs`:
  1. Text lines were rendered in **reversed order** — Shotstack positive offset.y is UP, so the formula `(i - (n-1)/2) * step` put the first line at the bottom and the last at the top. Fixed by flipping to `((n-1)/2 - i) * step` in all five line-rendering loops.
  2. `lineStep` added 16px inter-line gap, but the frosted-glass backdrop used only 8px — leaving a 16px transparent gap between clips where the semi-transparent pill background showed against the video. Fixed by removing the gap entirely (`lineStep = fontSize*3/1920`) and updating backdrop height to match.
  - Commit: `3238038`
- **buildMultiLineClip (2026-04-27)**: Replaced separate backdrop + per-line clips with a single HTML element containing all text lines. Eliminates all sub-pixel compositor seams entirely — stripe is now structurally impossible.
  - Commit: `aecaf0e`
- **CTA family-aware (2026-04-27)**: `buildCtaClips` now accepts `contentFamily` and picks badge/headline/sub/btn/accent colour from `CTA_BY_FAMILY` (QUESTION=blue, WORD=green, NEWS=yellow). `buildSceneCaptionClips` and the `buildShotstackPayload` call chain now pass `content_family` end-to-end.
  - Commit: `aecaf0e`
- Text/audio desync on latest QUESTION video — timing calibration still open
- CTA glassmorphism card with scribble arrow: shipped `b0dffb3`

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
  - Reads `SHOTSTACK_API_KEY` and the self-host storage / bridge env vars automatically
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

## Callback UX Telemetry (2026-04-25)

Bot-funnel observability now includes callback lifecycle quality, not just reminder/result events.

- `src/lib/bot-funnel-dashboard.ts` now exposes `callback_telemetry_30d`
- summary includes:
  - counts for `received`, `answered`, `rendered`, `completed`, `failed`
  - answer / render / completion / failure rates
  - top callback handlers
  - failed handlers
  - render modes
  - average and p95 completion time

This is intended to surface “tap -> spinner -> no obvious UI change” regressions before they have to be diagnosed only from manual user reports.

## SEO Performance Board (2026-04-25)

A reproducible SEO performance board now exists:

- script:
  - `scripts/run-seo-performance-board.mjs`
- npm command:
  - `npm run run:seo-performance-board`

The board reports:

- top pages by impressions / clicks
- low-CTR opportunities
- high-CTR low-impression pages
- impression-to-redirect gaps
- zero-visibility SEO pages
- top queries
- cannibalization candidates

Current practical reading after a VPS-backed GSC smoke:

- the tooling is now ready
- real live Search Console signal is still extremely small
- `/` is currently the only clearly visible path in the sampled window
- most SEO landing pages still behave like zero-visibility inventory

This means the immediate constraint is no longer “missing SEO observability”, but low live search/indexing volume for the newer landing-page cluster.
