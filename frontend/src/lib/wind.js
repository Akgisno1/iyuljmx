/**
 * Shared parsing, formatting and statistics for the wind comparison data.
 *
 * The API returns naive UTC timestamps (e.g. "2026-01-02T23:00:00") and the
 * rows arrive newest-first. Everything in the UI goes through this module so
 * time zones and ordering are fixed in one place instead of per component.
 */

export const EMPTY_ITEMS = [];

const number0 = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });
const number1 = new Intl.NumberFormat("en-GB", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Parse an API timestamp as UTC (bare timestamps would otherwise be local). */
export function toDate(value) {
  if (value instanceof Date) return value;
  const text = String(value ?? "");
  if (!text) return new Date(NaN);
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(text);
  return new Date(hasZone ? text : `${text}Z`);
}

export function toMs(value) {
  return toDate(value).getTime();
}

export function mw(value) {
  return value == null || Number.isNaN(value) ? "—" : number0.format(value);
}

export function mw1(value) {
  return value == null || Number.isNaN(value) ? "—" : number1.format(value);
}

/** "+1,713 MW" / "−420 MW" — the sign matters for forecast bias. */
export function signedMw(value) {
  if (value == null || Number.isNaN(value)) return "—";
  const sign = value > 0 ? "+" : value < 0 ? "−" : "";
  return `${sign}${number0.format(Math.abs(value))} MW`;
}

export function mwh(value) {
  return value == null || Number.isNaN(value) ? "—" : number0.format(value);
}

export function pct(value, digits = 1) {
  if (value == null || Number.isNaN(value)) return "—";
  return `${value.toFixed(digits)}%`;
}

export const fmtHour = (ms) =>
  new Date(ms).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

export const fmtDayShort = (ms) =>
  new Date(ms).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });

export const fmtDayLong = (ms) =>
  new Date(ms).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export const fmtDayTime = (ms) =>
  new Date(ms).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

/** "2026-01-01" -> "01 Jan" without timezone surprises. */
export function isoDayLabel(iso) {
  const [y, m, d] = String(iso).split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

export function isoDay(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;
}

export function formatRange(fromIso, toIso) {
  if (!fromIso) return "—";
  const from = isoDayLabel(fromIso);
  if (!toIso || toIso === fromIso) return from;
  return `${from} → ${isoDayLabel(toIso)}`;
}

const mean = (values) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

const sum = (values) => values.reduce((total, value) => total + value, 0);

/** Linear-interpolated percentile on an already sorted numeric array. */
function percentile(sorted, fraction) {
  if (!sorted.length) return 0;
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sorted[lower];
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

/**
 * Everything the dashboard shows, derived from the paired comparison rows.
 *
 * Sign convention follows the API: error = forecast − actual.
 *   positive error -> forecast too high (wind came in lower: shortfall risk)
 *   negative error -> forecast too low (surplus wind)
 */
export function computeStats(items) {
  const rows = Array.isArray(items) ? items : [];
  if (!rows.length) return null;

  const errors = rows.map((row) => row.error ?? 0);
  const absErrors = errors.map(Math.abs).sort((a, b) => a - b);
  const actuals = rows.map((row) => row.actual ?? 0);
  const forecasts = rows.map((row) => row.forecast ?? 0);

  const mae = mean(absErrors);
  const bias = mean(errors);
  const rmse = Math.sqrt(mean(errors.map((error) => error * error)));
  const p90 = percentile(absErrors, 0.9);
  const peakShortfall = Math.max(...errors.map((error) => Math.max(0, error)));
  const backupNeeded = mean(errors.map((error) => Math.max(0, error)));

  const over = rows.filter((row) => (row.error ?? 0) > 0).length;
  const under = rows.filter((row) => (row.error ?? 0) < 0).length;

  const absolutePct = rows
    .filter((row) => (row.actual ?? 0) > 50)
    .map((row) => (Math.abs(row.error ?? 0) / row.actual) * 100);

  const sortedTimes = rows.map((row) => row.startTime).sort();
  const dayKeys = new Set(rows.map((row) => String(row.startTime).slice(0, 10)));

  const worst = [...rows]
    .sort((a, b) => Math.abs(b.error ?? 0) - Math.abs(a.error ?? 0))
    .slice(0, 8)
    .map((row) => ({ ...row, at: toMs(row.startTime) }));

  return {
    n: rows.length,
    days: dayKeys.size,
    mae,
    bias,
    rmse,
    p90,
    maxAbs: Math.max(...absErrors),
    meanActual: mean(actuals),
    meanForecast: mean(forecasts),
    meanAbsPct: mean(absolutePct),
    over,
    under,
    overShare: (over / rows.length) * 100,
    backupNeeded,
    peakShortfall,
    // Each row is one settlement period (30 minutes) of measured generation.
    actualMwh: sum(actuals) * 0.5,
    forecastMwh: sum(forecasts) * 0.5,
    netMwh: sum(errors) * 0.5,
    first: sortedTimes[0],
    last: sortedTimes[sortedTimes.length - 1],
    worst,
  };
}

/** One entry per delivery day, used by the daily error chart and table. */
export function groupByDay(items) {
  const buckets = new Map();

  for (const row of items || []) {
    const key = String(row.startTime).slice(0, 10);
    if (!buckets.has(key)) {
      buckets.set(key, { key, label: isoDayLabel(key), rows: [] });
    }
    buckets.get(key).rows.push(row);
  }

  return [...buckets.values()]
    .sort((a, b) => a.key.localeCompare(b.key))
    .map(({ key, label, rows }) => {
      const stats = computeStats(rows);
      const [year, month, day] = key.split("-").map(Number);
      return {
        key,
        label,
        ms: Date.UTC(year, month - 1, day),
        mae: stats.mae,
        bias: stats.bias,
        maxAbs: stats.maxAbs,
        peakShortfall: stats.peakShortfall,
        overShare: stats.overShare,
        n: stats.n,
        meanActual: stats.meanActual,
        meanForecast: stats.meanForecast,
        actualMwh: stats.actualMwh,
        forecastMwh: stats.forecastMwh,
      };
    });
}

/** Delivery days ranked by how much cover they would have needed. */
export function worstDays(items, count = 6) {
  return groupByDay(items)
    .sort((a, b) => b.peakShortfall - a.peakShortfall)
    .slice(0, count);
}

/**
 * Shortfall exposure: how many MW of cover each share of periods needs.
 *
 * The forecast being too high is the case that costs money, so only positive
 * errors are counted here. A period where the forecast was too low needs no
 * cover and sits at zero.
 */
export function shortfallStats(items) {
  const shortfalls = (items || [])
    .map((row) => Math.max(0, row.error ?? 0))
    .sort((a, b) => a - b);

  const n = shortfalls.length;
  const over3 = shortfalls.filter((value) => value > 3000).length;

  return {
    n,
    p50: percentile(shortfalls, 0.5),
    p75: percentile(shortfalls, 0.75),
    p90: percentile(shortfalls, 0.9),
    p95: percentile(shortfalls, 0.95),
    p99: percentile(shortfalls, 0.99),
    peak: shortfalls[n - 1] ?? 0,
    over3,
    over3Share: n ? (over3 / n) * 100 : 0,
  };
}

const SHORTFALL_BANDS = [
  { label: "0–0.5", min: 0, max: 500 },
  { label: "0.5–1", min: 500, max: 1000 },
  { label: "1–2", min: 1000, max: 2000 },
  { label: "2–3", min: 2000, max: 3000 },
  { label: "3–4", min: 3000, max: 4000 },
  { label: "4+", min: 4000, max: Infinity },
];

/**
 * Settlement periods grouped by how much cover each one needed, so the shape of
 * the tail is visible instead of hidden behind a cumulative curve.
 */
export function shortfallBands(items) {
  const shortfalls = (items || []).map((row) => Math.max(0, row.error ?? 0));
  const n = shortfalls.length;

  return SHORTFALL_BANDS.map(({ label, min, max }) => {
    const count = shortfalls.filter((value) => value >= min && value < max).length;
    return {
      label,
      count,
      share: n ? (count / n) * 100 : 0,
    };
  });
}

const WIND_LEVELS = [
  { id: "low", label: "Under 5 GW", min: 0, max: 5000 },
  { id: "mid", label: "5 to 10 GW", min: 5000, max: 10000 },
  { id: "high", label: "10 to 15 GW", min: 10000, max: 15000 },
  { id: "top", label: "Over 15 GW", min: 15000, max: Infinity },
];

/**
 * Accuracy split by how much wind was actually delivered. Forecast error in
 * GB wind grows with output, so the same MW miss means something different on
 * a calm day and a stormy one.
 */
export function byWindLevel(items) {
  const rows = items || [];

  return WIND_LEVELS.map(({ id, label, min, max }) => {
    const bucket = rows.filter(
      (row) => (row.actual ?? 0) >= min && (row.actual ?? 0) < max
    );
    const stats = computeStats(bucket);

    return {
      id,
      label,
      n: bucket.length,
      share: rows.length ? (bucket.length / rows.length) * 100 : 0,
      mae: stats?.mae ?? 0,
      bias: stats?.bias ?? 0,
      overShare: stats?.overShare ?? 0,
    };
  });
}

/** Daily coverage summary used by the sidebar status row. */
export function coverage(items) {
  const rows = items || [];
  const days = new Set(rows.map((row) => String(row.startTime).slice(0, 10))).size;
  return {
    slots: rows.length,
    days,
    expectedSlots: days * 24,
  };
}
