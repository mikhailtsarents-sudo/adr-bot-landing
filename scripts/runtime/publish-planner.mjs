// Publish Planner — picks the next optimal YouTube upload slot.
// Slots are determined by day-of-week and hour targets tuned for
// German ADR / truck-driver audience engagement patterns.

// Best upload windows (UTC): early morning Mon-Fri and mid-afternoon.
// German truckers check phones: 06:00–08:00 and 13:00–15:00 CET (= UTC+1/+2).
const PREFERRED_SLOTS_UTC = [
  { day: 1, hour: 5  }, // Monday 06:00 CET
  { day: 2, hour: 5  }, // Tuesday 06:00 CET
  { day: 3, hour: 5  }, // Wednesday 06:00 CET
  { day: 4, hour: 5  }, // Thursday 06:00 CET
  { day: 5, hour: 5  }, // Friday 06:00 CET
  { day: 1, hour: 12 }, // Monday 13:00 CET
  { day: 3, hour: 12 }, // Wednesday 13:00 CET
  { day: 5, hour: 12 }, // Friday 13:00 CET
];

// Minimum gap between uploads of the same family (hours)
const MIN_GAP_HOURS = {
  QUESTION: 4,
  WORD: 6,
  NEWS: 8,
};

function nextSlotAfter(fromDate) {
  const from = new Date(fromDate);
  let candidate = new Date(from);
  candidate.setUTCMinutes(0, 0, 0);
  candidate.setUTCHours(candidate.getUTCHours() + 1);

  for (let attempt = 0; attempt < 7 * 24; attempt += 1) {
    const dayOfWeek = candidate.getUTCDay();
    const hour = candidate.getUTCHours();
    const isPreferred = PREFERRED_SLOTS_UTC.some(
      (slot) => slot.day === dayOfWeek && slot.hour === hour,
    );
    if (isPreferred) return new Date(candidate);
    candidate.setUTCHours(candidate.getUTCHours() + 1);
  }

  return candidate;
}

/**
 * Returns the next recommended publish time for a given content family.
 *
 * @param {string} contentFamily QUESTION | WORD | NEWS
 * @param {Date|string} [after] Earliest allowed publish time (default: now)
 * @returns {{ publishAt: Date, publishAtIso: string, slotType: string }}
 */
export function pickNextPublishSlot(contentFamily = "QUESTION", after = new Date()) {
  const minGapMs = (MIN_GAP_HOURS[String(contentFamily).toUpperCase()] || 4) * 3600 * 1000;
  const earliest = new Date(Math.max(Number(new Date(after)), Date.now() + minGapMs));

  const publishAt = nextSlotAfter(earliest);
  return {
    publishAt,
    publishAtIso: publishAt.toISOString(),
    slotType: "preferred_window",
    contentFamily,
  };
}

/**
 * Returns publish slots for a batch of items.
 * Each successive item is spaced at least minGap hours after the previous.
 *
 * @param {Array<{family: string}>} items
 * @returns {Array<{family: string, publishAtIso: string}>}
 */
export function buildPublishSchedule(items) {
  let cursor = new Date();
  return (items || []).map((item) => {
    const slot = pickNextPublishSlot(item.family || "QUESTION", cursor);
    cursor = new Date(slot.publishAt.getTime() + 60 * 60 * 1000);
    return { ...item, publishAtIso: slot.publishAtIso };
  });
}
