export type CalendarDate = {
  year: number;
  month: number;
  day: number;
};

const MONTH_NUMBERS = new Map<string, number>([
  ["stycznia", 1],
  ["styczeń", 1],
  ["styczen", 1],
  ["january", 1],
  ["jan", 1],
  ["січня", 1],
  ["lutego", 2],
  ["luty", 2],
  ["february", 2],
  ["feb", 2],
  ["лютого", 2],
  ["marca", 3],
  ["marzec", 3],
  ["march", 3],
  ["mar", 3],
  ["березня", 3],
  ["kwietnia", 4],
  ["kwiecień", 4],
  ["kwiecien", 4],
  ["april", 4],
  ["apr", 4],
  ["квітня", 4],
  ["maja", 5],
  ["maj", 5],
  ["may", 5],
  ["травня", 5],
  ["czerwca", 6],
  ["czerwiec", 6],
  ["june", 6],
  ["jun", 6],
  ["червня", 6],
  ["lipca", 7],
  ["lipiec", 7],
  ["july", 7],
  ["jul", 7],
  ["липня", 7],
  ["sierpnia", 8],
  ["sierpień", 8],
  ["sierpien", 8],
  ["august", 8],
  ["aug", 8],
  ["серпня", 8],
  ["września", 9],
  ["wrzesnia", 9],
  ["wrzesień", 9],
  ["wrzesien", 9],
  ["september", 9],
  ["sep", 9],
  ["вересня", 9],
  ["października", 10],
  ["pazdziernika", 10],
  ["październik", 10],
  ["pazdziernik", 10],
  ["october", 10],
  ["oct", 10],
  ["жовтня", 10],
  ["listopada", 11],
  ["listopad", 11],
  ["november", 11],
  ["nov", 11],
  ["листопада", 11],
  ["grudnia", 12],
  ["grudzień", 12],
  ["grudzien", 12],
  ["december", 12],
  ["dec", 12],
  ["грудня", 12],
]);

const MONTH_PATTERN = [...MONTH_NUMBERS.keys()]
  .sort((left, right) => right.length - left.length)
  .join("|");

const ISO_DATE = /(?<!\d)(\d{4})-(\d{2})-(\d{2})(?!\d)/gu;
const NUMERIC_DATE = /(?<!\d)(\d{1,2})[./-](\d{1,2})[./-](\d{4})(?!\d)/gu;
const DAY_MONTH_DATE = new RegExp(
  `(?<!\\d)(\\d{1,2})(?:st|nd|rd|th)?(?!\\d)\\s+(${MONTH_PATTERN})(?![\\p{L}])\\s+(\\d{4})(?!\\d)`,
  "giu",
);
const MONTH_DAY_DATE = new RegExp(
  `(?<![\\p{L}])(${MONTH_PATTERN})(?![\\p{L}])\\s+(\\d{1,2})(?:st|nd|rd|th)?(?!\\d),?\\s+(\\d{4})(?!\\d)`,
  "giu",
);

type DateHit = {
  index: number;
  date: CalendarDate;
};

function calendarDate(
  year: number,
  month: number,
  day: number,
): CalendarDate | null {
  if (year < 1900 || year > 2100) return null;
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year ||
    utc.getUTCMonth() !== month - 1 ||
    utc.getUTCDate() !== day
  ) {
    return null;
  }
  return { year, month, day };
}

function addDateHit(
  hits: DateHit[],
  index: number,
  year: number,
  month: number,
  day: number,
) {
  const date = calendarDate(year, month, day);
  if (date) hits.push({ index, date });
}

export function parseDeadlineDate(deadline: string): CalendarDate | null {
  const hits: DateHit[] = [];

  for (const match of deadline.matchAll(ISO_DATE)) {
    addDateHit(hits, match.index, +match[1], +match[2], +match[3]);
  }
  for (const match of deadline.matchAll(NUMERIC_DATE)) {
    addDateHit(hits, match.index, +match[3], +match[2], +match[1]);
  }
  for (const match of deadline.matchAll(DAY_MONTH_DATE)) {
    const month = MONTH_NUMBERS.get(match[2].toLowerCase());
    if (month) addDateHit(hits, match.index, +match[3], month, +match[1]);
  }
  for (const match of deadline.matchAll(MONTH_DAY_DATE)) {
    const month = MONTH_NUMBERS.get(match[1].toLowerCase());
    if (month) addDateHit(hits, match.index, +match[3], month, +match[2]);
  }

  hits.sort((left, right) => left.index - right.index);
  return hits[0]?.date ?? null;
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function formatIcsDate(date: CalendarDate) {
  return `${date.year}${pad(date.month)}${pad(date.day)}`;
}

function nextDay(date: CalendarDate): CalendarDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCDate(utc.getUTCDate() + 1);
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

function formatUtcStamp(date: Date) {
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

function escapeIcsText(value: string) {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll("\r\n", "\n")
    .replaceAll("\n", "\\n")
    .replaceAll(",", "\\,")
    .replaceAll(";", "\\;");
}

function foldIcsLine(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  let limit = 75;

  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit && current) {
      parts.push(current);
      current = char;
      bytes = size;
      limit = 74;
    } else {
      current += char;
      bytes += size;
    }
  }
  if (current) parts.push(current);
  return parts.join("\r\n ");
}

function textHash(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

export function buildDeadlineCalendar(deadline: string, now = new Date()) {
  const text = deadline.trim();
  const date = parseDeadlineDate(text);
  if (!date) return null;

  const uid = `deadline-${formatIcsDate(date)}-${textHash(text)}@prostefakty`;
  const contents = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ProsteFakty//Deadline reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatUtcStamp(now)}`,
    `DTSTART;VALUE=DATE:${formatIcsDate(date)}`,
    `DTEND;VALUE=DATE:${formatIcsDate(nextDay(date))}`,
    foldIcsLine(`SUMMARY:${escapeIcsText(text)}`),
    foldIcsLine(`DESCRIPTION:${escapeIcsText(text)}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  return {
    filename: `deadline-${date.year}-${pad(date.month)}-${pad(date.day)}.ics`,
    contents: `${contents}\r\n`,
  };
}

export function downloadDeadlineCalendar(deadline: string) {
  const file = buildDeadlineCalendar(deadline);
  if (!file || typeof document === "undefined") return;

  const url = URL.createObjectURL(
    new Blob([file.contents], { type: "text/calendar;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = file.filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
