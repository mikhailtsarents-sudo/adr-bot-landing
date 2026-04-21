# Site Analytics Setup

This landing now emits three event types:

- `site_page_view`
- `telegram_cta_click`
- `telegram_redirect`

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

Example:

- `https://www.adr-bot.de/api/analytics/export.csv?limit=500`

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
