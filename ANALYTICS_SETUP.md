# Site Analytics Setup

This landing now emits three event types:

- `site_page_view`
- `telegram_cta_click`
- `telegram_redirect`

## Current Real Status

As of April 25, 2026:

- production analytics export is live on `adr-bot.de`;
- canonical raw site analytics truth now lives in `adr-ingest` on the VPS;
- canonical storage is Postgres table:
  - `adr_site_analytics_events`
- cross-project canonical analytics map:
  - `/Users/mihailcarenc/Documents/New project/adr-control-center/analytics-source-of-truth-map.md`
- Google Sheets reporting works;
- plain `IMPORTDATA(...)` in Google Sheets proved unreliable in practice;
- the reliable working bridge is the dedicated Apps Script refresh layer for `Понятная сводка`.

## What works immediately

Without any extra setup, you can already see:

- page traffic in Vercel Analytics;
- custom `telegram_cta_click` events in Vercel Analytics;
- server-side redirect hits in Vercel function logs.

## Recommended sink: adr-ingest on VPS

The app now writes analytics events directly into the VPS ingest service with:

- `ADR_INGEST_URL`
- `ADR_INGEST_API_KEY`

Each inserted row contains these fields:

```json
{
  "event": "telegram_redirect",
  "source": "seo_adr_pruefung_auf_deutsch_hero",
  "page_path": "/adr-pruefung-auf-deutsch",
  "page_slug": "adr-pruefung-auf-deutsch",
  "page_type": "seo",
  "locale": "de",
  "target": "https://t.me/Adr_wort_trainer_bot",
  "referrer": "https://www.google.com/",
  "user_agent": "Mozilla/5.0 ...",
  "occurred_at": "2026-04-21T10:40:00.000Z"
}
```

## Current live-ready setup

The current preferred path is:

1. The landing writes events directly into `adr-ingest`.
2. `adr-ingest` writes raw site analytics into VPS Postgres.
3. That raw storage acts as the source of truth for:
   - site visits
   - Telegram CTA clicks
   - Telegram redirect hits
4. Vercel-facing summary routes derive dashboards from that raw storage.
5. Google Sheets reads those summary routes as a presentation layer.

This avoids:

- paid Vercel custom events;
- stale split-state reporting;
- treating Google Sheets as raw persistence.

## Google Sheets bridge without Google API auth

The landing now also exposes analytics exports that can be consumed from Google Sheets:

- `/api/analytics/export.json`
- `/api/analytics/export.csv`
- `/api/analytics/dashboard.json`

Example:

- `https://www.adr-bot.de/api/analytics/export.csv?limit=500`
- `https://www.adr-bot.de/api/analytics/dashboard.json?limit=2000`

The dashboard endpoint is the new preferred machine-readable summary layer. It returns:

- `today`
- `7 days`
- `30 days`
- funnel summary for the last 30 days
- top sources
- top pages
- top page types
- latest events
- latest Telegram redirects

Important detail:

- `today` is calculated in the dashboard timezone, not as a floating "last 24 hours" bucket
- default timezone:
  - `Europe/Berlin`
- override if needed:
  - `ANALYTICS_DASHBOARD_TIMEZONE`
  - or `?timezone=...` on the endpoint

In Google Sheets, the simplest bridge is:

```gs
=IMPORTDATA("https://www.adr-bot.de/api/analytics/export.csv?limit=500")
```

Useful filtered examples:

```gs
=IMPORTDATA("https://www.adr-bot.de/api/analytics/export.csv?limit=500&event=site_page_view")
```

```gs
=IMPORTDATA("https://www.adr-bot.de/api/analytics/export.csv?limit=500&event=telegram_cta_click")
```

```gs
=IMPORTDATA("https://www.adr-bot.de/api/analytics/export.csv?limit=500&event=telegram_redirect")
```

This does not require:

- Apps Script deployment;
- Google OAuth setup in the landing;
- extra paid analytics tooling.

## Readable summary auto-refresh for Google Sheets

The whole `Понятная сводка` tab now refreshes automatically through a dedicated Apps Script:

- `/Users/mihailcarenc/Documents/New project/adr-bot-landing/google-apps-script/readable_summary_refresh.gs`

What it does:

- fetches live site summary from:
  - `/api/analytics/dashboard.json`
- fetches live bot funnel summary from:
  - `/api/analytics/bot-funnel.json`
- rebuilds the whole `Понятная сводка` tab in one pass
- shows clear partial-failure status if one source is temporarily unavailable

Required Apps Script properties:

- `ADR_SITE_ANALYTICS_DASHBOARD_URL`
  - example:
    - `https://www.adr-bot.de/api/analytics/dashboard.json?limit=2000`
- `ADR_BOT_FUNNEL_DASHBOARD_URL`
  - example:
    - `https://www.adr-bot.de/api/analytics/bot-funnel.json?limit=2000`
- `READABLE_SUMMARY_TIMEZONE`
  - default:
    - `Europe/Berlin`

Main Apps Script entrypoints:

- `refreshReadableSummary()`
- `installReadableSummaryTrigger()`

Current live state:

- the tab is already created and populated;
- hourly trigger is already installed;
- `bot-funnel.json` is live and returns `ok: true`;
- `ADR_INGEST_URL` / `ADR_INGEST_API_KEY` are the canonical storage path for machine-readable analytics.

This is the preferred fix for the old problem where the lower event list in `Понятная сводка` stopped at an older date even though newer live activity existed.

Practical production meaning now:

- the sheet no longer depends on direct self-host `n8n` API access;
- the Apps Script reads two stable Vercel-facing summaries instead;
- this removes the old surprise mode where the top block looked fresh but the lower event area stayed stale.

## Important Production Note About Google Sheets

In practice, direct `IMPORTDATA(...)` may fail or cache earlier bad responses even when the export endpoint itself is healthy.

The working fallback is a custom Apps Script function:

```javascript
function ADR_IMPORT_CSV() {
  const url = "https://www.adr-bot.de/api/analytics/export.csv?limit=250";
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    headers: {
      "Accept": "text/csv"
    }
  });

  const code = response.getResponseCode();
  const text = response.getContentText();

  if (code !== 200) {
    throw new Error("HTTP " + code + ": " + text);
  }

  return Utilities.parseCsv(text);
}
```

Then in the sheet:

```gs
=ADR_IMPORT_CSV()
```

Important detail:

- the current export limit must stay `<= 250`
- larger values return a `400` error from the export route

## Suggested sheet columns

- `occurred_at`
- `event`
- `source`
- `page_path`
- `page_slug`
- `page_type`
- `locale`
- `target`
- `referrer`
- `user_agent`

## Recommended views

## YouTube -> Bot attribution

Prepared locally on `2026-04-24`:

- render packages for `QUESTION / WORD / NEWS` now append a Telegram deep-link into the YouTube description;
- the token format is:
  - `yt--shorts--<render_task_id>`
- the same deep-link is also written into `cta_url` inside `publish_ready_package.json`

Practical meaning:

- when a user opens the bot from a YouTube description, `/start` can now be attributed as a YouTube entry instead of generic direct traffic;
- this closes the missing `YouTube -> Bot` handoff on the content-package layer.

In the sheet, add three pivot views:

1. Page views by URL
2. Telegram clicks by source
3. Redirects to Telegram by page path

## Fallback path

If direct `adr-ingest` access is not available, the app still supports a generic webhook sink via:

- `ANALYTICS_WEBHOOK_URL`

This fallback remains useful for temporary Google Apps Script or other webhook collectors, but it is no longer the preferred production path.

## Recommended Interpretation Layer

For day-to-day reporting, the most important fields are:

- `received_at`
- `occurred_at`
- `event`
- `source`
- `page_path`
- `page_slug`
- `page_type`
- `locale`
- `target`
- `referrer`

Mostly technical/debug fields:

- `user_agent`
- `auth_ok`
- `raw_json`
