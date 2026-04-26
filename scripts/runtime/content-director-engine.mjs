// Content Director — decides the next production plan based on recent history and targets.
// Reads render_generation_log to avoid over-producing one family.
// Output: { plan: [{ family, count }], reason }

const DB_URL = process.env.N8N_DB_URL || process.env.DATABASE_URL || "";

const FAMILY_DAILY_TARGETS = {
  QUESTION: Number(process.env.DIRECTOR_DAILY_QUESTION || 3),
  WORD: Number(process.env.DIRECTOR_DAILY_WORD || 2),
  NEWS: Number(process.env.DIRECTOR_DAILY_NEWS || 1),
};

const LOOKBACK_HOURS = 24;

function text(value) {
  return value == null ? "" : String(value).trim();
}

async function queryRecentCounts() {
  const dbUrl = text(DB_URL);
  if (!dbUrl) return null;

  let pg;
  try { pg = await import("pg"); } catch { return null; }
  const Pool = pg.default?.Pool ?? pg.Pool;
  if (!Pool) return null;

  const pool = new Pool({ connectionString: dbUrl, max: 1 });
  try {
    const result = await pool.query(
      `SELECT content_family, COUNT(*) AS cnt
       FROM render_generation_log
       WHERE created_at >= NOW() - INTERVAL '${LOOKBACK_HOURS} hours'
       GROUP BY content_family`,
    );
    const counts = {};
    for (const row of result.rows) {
      counts[String(row.content_family).toUpperCase()] = Number(row.cnt);
    }
    return counts;
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Returns a production plan for today.
 * @returns {Promise<{ plan: Array<{family: string, count: number}>, reason: string }>}
 */
export async function buildProductionPlan() {
  const recentCounts = await queryRecentCounts().catch(() => null) || {};

  const plan = [];
  const reasons = [];

  for (const [family, target] of Object.entries(FAMILY_DAILY_TARGETS)) {
    const produced = Number(recentCounts[family] || 0);
    const remaining = Math.max(0, target - produced);
    if (remaining > 0) {
      plan.push({ family, count: remaining });
      reasons.push(`${family}: ${remaining} remaining (${produced}/${target})`);
    }
  }

  if (plan.length === 0) {
    return {
      plan: [],
      reason: "all_targets_met",
      targets: FAMILY_DAILY_TARGETS,
      recent_counts: recentCounts,
    };
  }

  // Sort by most-needed first
  plan.sort((a, b) => b.count - a.count);

  return {
    plan,
    reason: reasons.join("; "),
    targets: FAMILY_DAILY_TARGETS,
    recent_counts: recentCounts,
  };
}

/**
 * Quick check: returns true if the given family still has capacity today.
 * @param {string} family QUESTION | WORD | NEWS
 */
export async function familyHasCapacity(family) {
  const recentCounts = await queryRecentCounts().catch(() => null) || {};
  const produced = Number(recentCounts[String(family).toUpperCase()] || 0);
  const target = FAMILY_DAILY_TARGETS[String(family).toUpperCase()] ?? 1;
  return produced < target;
}

async function queryFunnelConversions(lookbackDays = 7) {
  const dbUrl = text(DB_URL);
  if (!dbUrl) return null;

  let pg;
  try { pg = await import("pg"); } catch { return null; }
  const Pool = pg.default?.Pool ?? pg.Pool;
  if (!Pool) return null;

  const pool = new Pool({ connectionString: dbUrl, max: 1 });
  try {
    const result = await pool.query(
      `SELECT
         CASE
           WHEN entry_source_token LIKE 'yt--question--%' THEN 'QUESTION'
           WHEN entry_source_token LIKE 'yt--word--%' THEN 'WORD'
           WHEN entry_source_token LIKE 'yt--news--%' THEN 'NEWS'
           ELSE 'UNKNOWN'
         END AS family,
         COUNT(*) AS conversions
       FROM adr_bot_funnel_events
       WHERE occurred_at >= NOW() - INTERVAL '${lookbackDays} days'
         AND entry_source_token LIKE 'yt--%'
       GROUP BY family`,
    );
    const counts = {};
    for (const row of result.rows) {
      counts[row.family] = Number(row.conversions);
    }
    return counts;
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Returns per-family bot conversion counts from YouTube deeplinks over last N days.
 * Used to understand which content family drives the most bot sign-ups.
 */
export async function getFunnelConversionsByFamily(lookbackDays = 7) {
  const counts = await queryFunnelConversions(lookbackDays).catch(() => null);
  if (!counts) {
    return { available: false, counts: {}, reason: "db_unavailable" };
  }
  return { available: true, counts, lookback_days: lookbackDays };
}

/**
 * Enriched production plan: includes conversion data to weigh family priority.
 * Families with higher conversion rates get +10% weight.
 */
export async function buildEnrichedProductionPlan() {
  const [base, conversions] = await Promise.all([
    buildProductionPlan(),
    getFunnelConversionsByFamily(7),
  ]);

  if (!conversions.available || base.plan.length === 0) {
    return { ...base, conversions: conversions.counts };
  }

  const totalConversions = Object.values(conversions.counts).reduce((a, b) => a + b, 0) || 1;

  const enriched = base.plan.map((item) => {
    const convRate = (conversions.counts[item.family] || 0) / totalConversions;
    return { ...item, conversion_rate: Number(convRate.toFixed(3)) };
  });

  enriched.sort((a, b) => (b.count + b.conversion_rate * 2) - (a.count + a.conversion_rate * 2));

  return {
    ...base,
    plan: enriched,
    conversions: conversions.counts,
  };
}
