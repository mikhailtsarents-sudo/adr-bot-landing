// Writes generation metadata to render_generation_log table via n8n Postgres.
// Non-blocking: errors are logged but never thrown.

const DB_URL = process.env.N8N_DB_URL || process.env.DATABASE_URL || "";

function text(value) {
  return value == null ? "" : String(value).trim();
}

function buildInsertSql(entry) {
  return {
    sql: `INSERT INTO render_generation_log
      (render_task_id, source_id, content_family, provider_used, video_seed,
       i2i_enabled, frame_count, tts_voice, tts_optimizer_used,
       scene_enhancer_used, creative_planner_used, generation_duration_ms)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    params: [
      text(entry.render_task_id),
      text(entry.source_id),
      text(entry.content_family),
      text(entry.provider_used),
      entry.video_seed != null ? Number(entry.video_seed) : null,
      Boolean(entry.i2i_enabled),
      Number(entry.frame_count) || 0,
      text(entry.tts_voice),
      Boolean(entry.tts_optimizer_used),
      Boolean(entry.scene_enhancer_used),
      Boolean(entry.creative_planner_used),
      entry.generation_duration_ms != null ? Number(entry.generation_duration_ms) : null,
    ],
  };
}

async function execQuery(sql, params) {
  const dbUrl = text(DB_URL);
  if (!dbUrl) {
    return;
  }

  // Use node-postgres if available, otherwise skip silently.
  let pg;
  try {
    pg = await import("pg");
  } catch {
    return;
  }

  const Pool = pg.default?.Pool ?? pg.Pool;
  if (!Pool) return;

  const pool = new Pool({ connectionString: dbUrl, max: 1 });
  try {
    await pool.query(sql, params);
  } finally {
    await pool.end().catch(() => {});
  }
}

/**
 * Log render generation metadata to DB. Fire-and-forget — never throws.
 *
 * @param {object} entry
 * @param {string} entry.render_task_id
 * @param {string} [entry.source_id]
 * @param {string} [entry.content_family] QUESTION | WORD | NEWS
 * @param {string} [entry.provider_used]
 * @param {number|null} [entry.video_seed]
 * @param {boolean} [entry.i2i_enabled]
 * @param {number} [entry.frame_count]
 * @param {string} [entry.tts_voice]
 * @param {boolean} [entry.tts_optimizer_used]
 * @param {boolean} [entry.scene_enhancer_used]
 * @param {boolean} [entry.creative_planner_used]
 * @param {number|null} [entry.generation_duration_ms]
 */
export async function logRenderGeneration(entry) {
  if (!entry?.render_task_id) return;
  const { sql, params } = buildInsertSql(entry);
  await execQuery(sql, params).catch((err) => {
    console.warn(`[render-generation-logger] DB write skipped: ${err?.message || err}`);
  });
}
