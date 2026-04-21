const SHEET_NAME = "events";
const HEADERS = [
  "received_at",
  "occurred_at",
  "event",
  "source",
  "page_path",
  "page_slug",
  "page_type",
  "locale",
  "target",
  "referrer",
  "user_agent",
  "auth_ok",
  "raw_json",
];

function doGet() {
  return jsonResponse({
    ok: true,
    service: "adr-site-analytics-webhook",
    sheet: SHEET_NAME,
    timestamp: new Date().toISOString(),
  });
}

function doPost(e) {
  try {
    const secret = getScriptProperty_("ANALYTICS_WEBHOOK_SECRET");
    const providedSecret = getParam_(e, "secret");
    const authOk = validateSecret_(providedSecret, secret);

    if (!authOk) {
      return jsonResponse(
        {
          ok: false,
          error: "unauthorized",
        },
        401,
      );
    }

    const payload = parseBody_(e);
    if (!payload.event || !payload.source) {
      return jsonResponse(
        {
          ok: false,
          error: "missing_required_fields",
        },
        400,
      );
    }

    const sheet = getOrCreateSheet_();
    ensureHeaderRow_(sheet);

    sheet.appendRow([
      new Date().toISOString(),
      valueOrEmpty_(payload.occurred_at),
      valueOrEmpty_(payload.event),
      valueOrEmpty_(payload.source),
      valueOrEmpty_(payload.page_path),
      valueOrEmpty_(payload.page_slug),
      valueOrEmpty_(payload.page_type),
      valueOrEmpty_(payload.locale),
      valueOrEmpty_(payload.target),
      valueOrEmpty_(payload.referrer),
      valueOrEmpty_(payload.user_agent),
      authOk ? "true" : "false",
      JSON.stringify(payload),
    ]);

    return jsonResponse({
      ok: true,
      appended: true,
      sheet: SHEET_NAME,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: String(error && error.message ? error.message : error),
      },
      500,
    );
  }
}

function doGet(e) {
  try {
    const secret = getScriptProperty_("ANALYTICS_WEBHOOK_SECRET");
    const providedSecret = getParam_(e, "secret");
    const authOk = validateSecret_(providedSecret, secret);

    if (!authOk) {
      return jsonResponse(
        {
          ok: false,
          error: "unauthorized",
        },
        401,
      );
    }

    const payload = {
      event: getParam_(e, "event"),
      source: getParam_(e, "source"),
      page_path: getParam_(e, "page_path"),
      page_slug: getParam_(e, "page_slug"),
      page_type: getParam_(e, "page_type"),
      locale: getParam_(e, "locale"),
      target: getParam_(e, "target"),
      referrer: getParam_(e, "referrer"),
      user_agent: getParam_(e, "user_agent"),
      occurred_at: getParam_(e, "occurred_at"),
    };

    if (!payload.event || !payload.source) {
      return jsonResponse({
        ok: true,
        service: "adr-site-analytics-webhook",
        sheet: SHEET_NAME,
        timestamp: new Date().toISOString(),
      });
    }

    const sheet = getOrCreateSheet_();
    ensureHeaderRow_(sheet);

    sheet.appendRow([
      new Date().toISOString(),
      valueOrEmpty_(payload.occurred_at),
      valueOrEmpty_(payload.event),
      valueOrEmpty_(payload.source),
      valueOrEmpty_(payload.page_path),
      valueOrEmpty_(payload.page_slug),
      valueOrEmpty_(payload.page_type),
      valueOrEmpty_(payload.locale),
      valueOrEmpty_(payload.target),
      valueOrEmpty_(payload.referrer),
      valueOrEmpty_(payload.user_agent),
      authOk ? "true" : "false",
      JSON.stringify(payload),
    ]);

    return jsonResponse({
      ok: true,
      appended: true,
      method: "get",
      sheet: SHEET_NAME,
    });
  } catch (error) {
    return jsonResponse(
      {
        ok: false,
        error: String(error && error.message ? error.message : error),
      },
      500,
    );
  }
}

function getOrCreateSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  return sheet;
}

function ensureHeaderRow_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), HEADERS.length);
  const currentHeaders =
    sheet.getLastRow() > 0
      ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0]
      : [];

  const missingHeader =
    currentHeaders.length < HEADERS.length ||
    HEADERS.some((header, index) => currentHeaders[index] !== header);

  if (missingHeader) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function parseBody_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error("Empty request body");
  }

  return JSON.parse(e.postData.contents);
}

function getParam_(e, key) {
  if (!e || !e.parameter) {
    return "";
  }

  return e.parameter[key] || "";
}

function getScriptProperty_(key) {
  return PropertiesService.getScriptProperties().getProperty(key) || "";
}

function validateSecret_(providedSecret, secret) {
  if (!secret) {
    return true;
  }

  return providedSecret === secret;
}

function valueOrEmpty_(value) {
  return value == null ? "" : String(value);
}

function jsonResponse(payload, statusCode) {
  const output = ContentService.createTextOutput(JSON.stringify(payload));
  output.setMimeType(ContentService.MimeType.JSON);

  if (statusCode) {
    output.setContent(JSON.stringify({ ...payload, status: statusCode }));
  }

  return output;
}
