# Site Analytics Setup

This landing now emits three event types:

- `site_page_view`
- `telegram_cta_click`
- `telegram_redirect`

## Current Real Status

As of April 21, 2026:

- production analytics export is live on `adr-bot.de`;
- n8n Data Table is the intended source of truth;
- Google Sheets reporting works;
- plain `IMPORTDATA(...)` in Google Sheets proved unreliable in practice;
- the reliable working bridge is a small Apps Script function that fetches the CSV export directly.

## What works immediately

Without any extra setup, you can already see:

- page traffic in Vercel Analytics;
- custom `telegram_cta_click` events in Vercel Analytics;
- server-side redirect hits in Vercel function logs.

## Recommended sink: n8n Data Table

The app can now write every analytics event directly into an n8n Data Table with:

- `N8N_BASE_URL`
- `N8N_API_KEY`
- `N8N_ANALYTICS_TABLE_ID`

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

1. The landing writes events directly into the n8n Data Table API.
2. The Data Table acts as the source of truth for:
   - site visits
   - Telegram CTA clicks
   - Telegram redirect hits
3. If needed later, n8n can sync this table into Google Sheets for reporting.

This avoids:

- paid Vercel custom events;
- brittle anonymous Google Apps Script deployments;
- n8n workflow execution limits for webhook-based sinks.

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

In the sheet, add three pivot views:

1. Page views by URL
2. Telegram clicks by source
3. Redirects to Telegram by page path

## Fallback path

If direct n8n Data Table access is not available, the app still supports a generic webhook sink via:

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
