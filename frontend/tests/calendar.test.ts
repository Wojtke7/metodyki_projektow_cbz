import { describe, expect, test } from "bun:test";

import { buildDeadlineCalendar, parseDeadlineDate } from "../src/lib/calendar";

const now = new Date(Date.UTC(2026, 10, 24, 10, 0, 0));

describe("deadline date parsing", () => {
  test("reads the first real date in numeric, ISO, and named forms", () => {
    expect(parseDeadlineDate("30.11.2026")).toEqual({
      year: 2026,
      month: 11,
      day: 30,
    });
    expect(parseDeadlineDate("Do 30 listopada 2026 r.")).toEqual({
      year: 2026,
      month: 11,
      day: 30,
    });
    expect(parseDeadlineDate("November 30, 2026")).toEqual({
      year: 2026,
      month: 11,
      day: 30,
    });
    expect(parseDeadlineDate("30 листопада 2026")).toEqual({
      year: 2026,
      month: 11,
      day: 30,
    });
    expect(parseDeadlineDate("2026-11-30")).toEqual({
      year: 2026,
      month: 11,
      day: 30,
    });
    expect(
      parseDeadlineDate("Brak wpłaty do 20.11.2026 oznacza odsetki"),
    ).toEqual({
      year: 2026,
      month: 11,
      day: 20,
    });
  });

  test("ignores text with no calendar date and impossible dates", () => {
    expect(parseDeadlineDate("7 dni od doręczenia")).toBeNull();
    expect(parseDeadlineDate("Brak terminu w piśmie")).toBeNull();
    expect(parseDeadlineDate("31.02.2026")).toBeNull();
    expect(parseDeadlineDate("29.02.2025")).toBeNull();
    expect(parseDeadlineDate("29.02.2024")).toEqual({
      year: 2024,
      month: 2,
      day: 29,
    });
  });
});

describe("deadline calendar file", () => {
  test("puts the parsed deadline on that all-day date", () => {
    const file = buildDeadlineCalendar("Do 30 listopada 2026 r.", now);

    expect(file?.filename).toBe("deadline-2026-11-30.ics");
    expect(file?.contents).toContain("DTSTART;VALUE=DATE:20261130");
    expect(file?.contents).toContain("DTEND;VALUE=DATE:20261201");
    expect(file?.contents).toContain("DTSTAMP:20261124T100000Z");
    expect(file?.contents).toContain("SUMMARY:Do 30 listopada 2026 r.");
    expect(file?.contents.endsWith("\r\n")).toBe(true);
  });

  test("ends a 31 December reminder on 1 January", () => {
    const file = buildDeadlineCalendar("31.12.2026", now);

    expect(file?.contents).toContain("DTSTART;VALUE=DATE:20261231");
    expect(file?.contents).toContain("DTEND;VALUE=DATE:20270101");
  });

  test("escapes calendar punctuation in the deadline text", () => {
    const file = buildDeadlineCalendar("Pay by November 30, 2026", now);

    expect(file?.contents).toContain("SUMMARY:Pay by November 30\\, 2026");
  });

  test("returns no file when the deadline has no date", () => {
    expect(buildDeadlineCalendar("7 dni od doręczenia", now)).toBeNull();
  });
});
