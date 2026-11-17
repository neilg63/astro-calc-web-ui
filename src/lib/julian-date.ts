/**
 * Julian Day conversion, independent of the JavaScript `Date` object and of the browser's
 * time zone. Based on the earlier astro UI function library (`julian-date.ts`).
 *
 * Julian Days are in Universal Time. Calendar dates are proleptic Gregorian with
 * astronomical year numbering (year 0 = 1 BC), as the API reads and writes them.
 */

/** The Julian Day of 1970-01-01 00:00:00 UTC, the Unix epoch. */
export const JD_UNIX_EPOCH = 2440587.5

const SECONDS_PER_DAY = 86_400
/** Days from 0000-03-01 to 1970-01-01 in the proleptic Gregorian calendar. */
const DAYS_TO_UNIX_EPOCH = 719_468
const DAYS_PER_400_YEARS = 146_097

export interface DateParts {
  year: number
  month: number
  day: number
  hours: number
  minutes: number
  seconds: number
}

/** A Julian Day as Unix time in seconds. */
export function julToUnixTime(jd: number): number {
  return (jd - JD_UNIX_EPOCH) * SECONDS_PER_DAY
}

/** A Julian Day as Unix time in milliseconds, as used by the JavaScript `Date` object. */
export function julToUnixMillisecs(jd: number): number {
  return julToUnixTime(jd) * 1000
}

/** Unix time in seconds as a Julian Day. */
export function unixTimeToJul(ts: number): number {
  return ts / SECONDS_PER_DAY + JD_UNIX_EPOCH
}

/** The Julian Day of the present moment. */
export function currentJulianDay(): number {
  return unixTimeToJul(Date.now() / 1000)
}

/**
 * The calendar date and clock time of a Julian Day, rounded to the nearest second.
 * `tzOffset` is in seconds east of UTC (3600 for UTC+1, -18000 for UTC-5); 0 gives UTC.
 * Returns null when the Julian Day is not a finite number.
 */
export function julToDateParts(jd: number, tzOffset = 0): DateParts | null {
  if (!Number.isFinite(jd) || !Number.isFinite(tzOffset)) return null
  const totalSeconds = Math.round(julToUnixTime(jd)) + Math.round(tzOffset)
  const dayNumber = Math.floor(totalSeconds / SECONDS_PER_DAY)
  const secondOfDay = totalSeconds - dayNumber * SECONDS_PER_DAY

  // Days are counted from 1 March of year 0, so the leap day falls at the end of a year.
  const shifted = dayNumber + DAYS_TO_UNIX_EPOCH
  const era = Math.floor(shifted / DAYS_PER_400_YEARS)
  const dayOfEra = shifted - era * DAYS_PER_400_YEARS
  const yearOfEra = Math.floor(
    (dayOfEra - Math.floor(dayOfEra / 1460) + Math.floor(dayOfEra / 36_524) - Math.floor(dayOfEra / 146_096)) / 365,
  )
  const dayOfYear = dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100))
  const monthFromMarch = Math.floor((5 * dayOfYear + 2) / 153)
  const day = dayOfYear - Math.floor((153 * monthFromMarch + 2) / 5) + 1
  const month = monthFromMarch < 10 ? monthFromMarch + 3 : monthFromMarch - 9
  const year = yearOfEra + era * 400 + (month <= 2 ? 1 : 0)

  return {
    year,
    month,
    day,
    hours: Math.floor(secondOfDay / 3600),
    minutes: Math.floor((secondOfDay % 3600) / 60),
    seconds: secondOfDay % 60,
  }
}

/** The Julian Day of a calendar date and clock time. `tzOffset` is in seconds east of UTC. */
export function datePartsToJul(parts: DateParts, tzOffset = 0): number {
  const year = parts.month <= 2 ? parts.year - 1 : parts.year
  const era = Math.floor(year / 400)
  const yearOfEra = year - era * 400
  const monthFromMarch = parts.month > 2 ? parts.month - 3 : parts.month + 9
  const dayOfYear = Math.floor((153 * monthFromMarch + 2) / 5) + parts.day - 1
  const dayOfEra = yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear
  const dayNumber = era * DAYS_PER_400_YEARS + dayOfEra - DAYS_TO_UNIX_EPOCH
  const secondOfDay = parts.hours * 3600 + parts.minutes * 60 + parts.seconds
  return unixTimeToJul(dayNumber * SECONDS_PER_DAY + secondOfDay - tzOffset)
}

function zeroPad(value: number, places = 2): string {
  const digits = Math.abs(value).toString().padStart(places, '0')
  return value < 0 ? `-${digits}` : digits
}

function joinDateParts(parts: DateParts, separator: string, seconds: boolean): string {
  const date = [zeroPad(parts.year, 4), zeroPad(parts.month), zeroPad(parts.day)].join('-')
  const clock = [zeroPad(parts.hours), zeroPad(parts.minutes)]
  if (seconds) clock.push(zeroPad(parts.seconds))
  return `${date}${separator}${clock.join(':')}`
}

/**
 * A Julian Day as `YYYY-MM-DD hh:mm:ss`, the display form used throughout the app.
 * UTC unless `tzOffset` (seconds east of UTC) is given. Empty when the value is not a number.
 */
export function julToDateTimeString(jd: number, tzOffset = 0, seconds = true): string {
  const parts = julToDateParts(jd, tzOffset)
  return parts ? joinDateParts(parts, ' ', seconds) : ''
}

/** A Julian Day as `YYYY-MM-DDThh:mm:ss`, the form of a date-time input and of the API's `dt`. */
export function julToIsoDateTime(jd: number, tzOffset = 0): string {
  const parts = julToDateParts(jd, tzOffset)
  return parts ? joinDateParts(parts, 'T', true) : ''
}

/**
 * The Julian Day of a date-time string: `YYYY-MM-DD`, optionally followed by `T` or a space
 * and `hh:mm` or `hh:mm:ss`. A trailing `Z` and fractions of a second are ignored. The string
 * is read as UTC unless `tzOffset` (seconds east of UTC) is given. Returns null if unreadable.
 */
export function dateTimeStringToJul(text: string, tzOffset = 0): number | null {
  const match = /^\s*(-?\d{1,6})-(\d{1,2})-(\d{1,2})(?:[T\s](\d{1,2}):(\d{2})(?::(\d{2}))?)?/.exec(text)
  if (!match) return null
  const [year, month, day, hours = 0, minutes = 0, seconds = 0] = match.slice(1).map((part) => (part === undefined ? undefined : Number(part)))
  if (year === undefined || month === undefined || day === undefined) return null
  if (month < 1 || month > 12 || day < 1 || day > 31 || hours > 23 || minutes > 59 || seconds > 59) return null
  return datePartsToJul({ year, month, day, hours, minutes, seconds }, tzOffset)
}
