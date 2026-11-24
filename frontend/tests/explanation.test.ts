import { describe, expect, test } from "bun:test";

import { extractKeyFacts, isMissingLetterValue } from "../src/lib/explanation";
import i18n from "../src/translations";

describe("key facts extraction", () => {
  test("extracts trimmed deadlines, amount, and summary when present", () => {
    expect(
      extractKeyFacts({
        deadlines: ["  30.11.2026  ", "7 dni od doręczenia"],
        amount: " 1 308,00 zł ",
        summary: " Urząd Skarbowy wzywa do zapłaty zaległości. ",
      }),
    ).toEqual({
      deadlines: ["30.11.2026", "7 dni od doręczenia"],
      amount: "1 308,00 zł",
      summary: "Urząd Skarbowy wzywa do zapłaty zaległości.",
    });
  });

  test("treats empty values and Polish, English, and Ukrainian missing sentinels as missing", () => {
    expect(
      extractKeyFacts({
        deadlines: ["Brak terminu w piśmie.", "   ", "Missing in the letter"],
        amount: "Brak kwoty w piśmie",
        summary: "Brak informacji w piśmie.",
      }),
    ).toEqual({
      deadlines: [],
      amount: null,
      summary: null,
    });

    expect(isMissingLetterValue("Немає в листі")).toBe(true);
    expect(isMissingLetterValue("No amount in the letter.")).toBe(true);
    expect(isMissingLetterValue("")).toBe(true);
    expect(isMissingLetterValue(null)).toBe(true);
  });

  test("preserves real values even when they contain words like brak", () => {
    expect(
      extractKeyFacts({
        deadlines: [
          "Brak terminu w piśmie",
          "Brak wpłaty do 20.11.2026 oznacza odsetki",
        ],
        amount: "0 zł",
        summary: "Pismo dotyczy braku potwierdzenia wpłaty.",
      }),
    ).toEqual({
      deadlines: ["Brak wpłaty do 20.11.2026 oznacza odsetki"],
      amount: "0 zł",
      summary: "Pismo dotyczy braku potwierdzenia wpłaty.",
    });
  });
});

describe("key facts and disclaimer translations", () => {
  test("provides localized key facts labels, missing fallback, and disclaimer in PL, EN, and UK", async () => {
    if (!i18n.isInitialized) await i18n.init();

    const keys = [
      "explain.keyFacts",
      "explain.summary",
      "explain.deadline",
      "explain.downloadReminder",
      "explain.downloadReminderFor",
      "explain.amount",
      "explain.missingInLetter",
      "explain.disclaimerTitle",
      "explain.disclaimer",
    ] as const;

    try {
      for (const language of ["pl", "en", "uk"] as const) {
        await i18n.changeLanguage(language);
        for (const key of keys) {
          const translated = i18n.t(key);
          expect(translated).not.toBe(key);
          expect(translated.trim().length).toBeGreaterThan(0);
        }
      }

      await i18n.changeLanguage("pl");
      expect(i18n.t("explain.missingInLetter")).toBe("Brak w piśmie");
      await i18n.changeLanguage("en");
      expect(i18n.t("explain.missingInLetter")).toBe("Missing in the letter");
      await i18n.changeLanguage("uk");
      expect(i18n.t("explain.missingInLetter")).toBe("Немає в листі");
    } finally {
      await i18n.changeLanguage("pl");
    }
  });
});
