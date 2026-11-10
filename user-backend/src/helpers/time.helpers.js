// src/helpers/time.helpers.js
// Orders use India-local calendar days; database timestamps remain UTC.
export const BUSINESS_TIME_ZONE = 'Asia/Kolkata';
const businessDateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: BUSINESS_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23'
});

/** Current instant. */
export const nowUTC = () => new Date();

const businessDateParts = (date) =>
  Object.fromEntries(
    businessDateTimeFormatter
      .formatToParts(date)
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, value])
  );

/** Today's date as "YYYY-MM-DD" in the business timezone. */
export const todayInBusinessTimeZone = () => {
  const { year, month, day } = businessDateParts(nowUTC());
  return `${year}-${month}-${day}`;
};

/** True when the string is a valid "YYYY-MM-DD" calendar date. */
export const isValidDateString = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value))) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

/**
 * Convert a business-local midnight to its corresponding UTC instant.
 */
const businessMidnightUTC = (date) => {
  const wallTime = new Date(`${date}T00:00:00.000Z`).getTime();
  let instant = wallTime;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const parts = businessDateParts(new Date(instant));
    const localTimeAsUTC = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    );
    const nextInstant = wallTime - (localTimeAsUTC - instant);
    if (nextInstant === instant) break;
    instant = nextInstant;
  }

  return new Date(instant);
};

/**
 * UTC timestamp window for a business-local calendar date; end is exclusive.
 */
export const dayRangeInBusinessTimeZone = (date) => {
  const start = businessMidnightUTC(date);
  const nextDayDate = new Date(`${date}T00:00:00.000Z`);
  nextDayDate.setUTCDate(nextDayDate.getUTCDate() + 1);
  const nextDay = nextDayDate.toISOString().slice(0, 10);
  const end = businessMidnightUTC(nextDay);
  return { start, end };
};
