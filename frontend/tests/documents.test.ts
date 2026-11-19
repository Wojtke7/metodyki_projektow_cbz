import { describe, expect, test } from "bun:test";

import {
  explainBackendErrorKey,
  MAX_DOCUMENT_SIZE_MB,
  TranslatedError,
  validateDocuments,
} from "../src/lib/documents";
import i18n from "../src/translations";
import { explainErrorMessage } from "../src/hooks/useExplainDocuments";

describe("document upload validation", () => {
  test("accepts Word, PDF, TXT, and photo files, including uppercase extensions and empty MIME types", () => {
    const files = [
      "pismo.doc",
      "wniosek.docx",
      "decyzja.pdf",
      "notatka.txt",
      "skan.jpg",
      "zdjęcie.jpeg",
      "paragon.png",
      "PISMO.DOCX",
      "DECYZJA.PDF",
      "NOTATKA.TXT",
      "FAKTURA.JPEG",
      "SKAN.PNG",
    ].map((name) => new File(["document"], name));

    expect(validateDocuments(files)).toEqual({ accepted: files, errors: [] });
  });

  test("rejects unsupported files, missing extensions, and disguised extensions", () => {
    const files = [
      "zdjęcie.gif",
      "dokument",
      "decyzja.pdf.exe",
      "notatka.txt.exe",
    ].map((name) => new File(["document"], name));
    const result = validateDocuments(files);

    expect(result.accepted).toEqual([]);
    expect(result.errors).toEqual(
      files.map((file) => ({
        key: "errors.unsupportedType",
        name: file.name,
      })),
    );
  });

  test("accepts a file at 10 MB and rejects one byte above the per-file limit", () => {
    const atLimit = new File(
      [new Uint8Array(10 * 1024 * 1024)],
      "dozwolony.pdf",
    );
    const overLimit = new File(
      [new Uint8Array(10 * 1024 * 1024 + 1)],
      "za-duży.jpeg",
    );
    const result = validateDocuments([atLimit, overLimit]);

    expect(result.accepted).toEqual([atLimit]);
    expect(result.errors).toEqual([
      {
        key: "errors.tooLarge",
        name: "za-duży.jpeg",
        maxSize: MAX_DOCUMENT_SIZE_MB,
      },
    ]);
  });

  test("applies the size limit per file rather than to the whole selection", () => {
    const files = ["pierwszy.doc", "drugi.pdf"].map(
      (name) => new File([new Uint8Array(6 * 1024 * 1024)], name),
    );

    expect(validateDocuments(files)).toEqual({ accepted: files, errors: [] });
  });

  test("keeps valid files in order when a selection also contains invalid files", () => {
    const first = new File(["document"], "pierwszy.docx");
    const invalid = new File(["image"], "zdjęcie.gif");
    const second = new File(["document"], "drugi.pdf");
    const result = validateDocuments([first, invalid, second]);

    expect(result.accepted).toEqual([first, second]);
    expect(result.errors).toEqual([
      { key: "errors.unsupportedType", name: "zdjęcie.gif" },
    ]);
  });

  test("handles an empty selection without errors", () => {
    expect(validateDocuments([])).toEqual({ accepted: [], errors: [] });
  });
});

describe("backend explain errors", () => {
  test("maps wrong type, file too big, and no text from status or detail", () => {
    expect(explainBackendErrorKey(415, "<html>unsupported</html>")).toBe(
      "errors.unsupportedType",
    );
    expect(explainBackendErrorKey(400, { detail: "wrong type" })).toBe(
      "errors.unsupportedType",
    );
    expect(explainBackendErrorKey(413, { detail: "payload" })).toBe(
      "errors.tooLarge",
    );
    expect(explainBackendErrorKey(400, { error: "file-too-large" })).toBe(
      "errors.tooLarge",
    );
    expect(explainBackendErrorKey(422, { detail: { code: "no_text" } })).toBe(
      "errors.noText",
    );
    expect(explainBackendErrorKey(422, "No text.")).toBe("errors.noText");
    expect(
      explainBackendErrorKey(422, { detail: [{ msg: "Field required" }] }),
    ).toBeNull();
    expect(
      explainBackendErrorKey(500, { detail: "The AI service failed." }),
    ).toBeNull();
  });

  test("shows wrong type, file too big, and no text in PL, EN, and UK", async () => {
    const messages = {
      pl: {
        unsupportedType:
          "„scan.png”: wybierz plik DOC, DOCX, PDF, TXT, JPG, JPEG lub PNG.",
        tooLarge: "„big.jpeg”: plik przekracza maksymalny rozmiar 10 MB.",
        noText: "„empty.pdf”: brak tekstu do wyjaśnienia.",
      },
      en: {
        unsupportedType:
          "“scan.png”: choose a DOC, DOCX, PDF, TXT, JPG, JPEG, or PNG file.",
        tooLarge: "“big.jpeg”: file exceeds the maximum size of 10 MB.",
        noText: "“empty.pdf”: no text to explain.",
      },
      uk: {
        unsupportedType:
          "«scan.png»: виберіть файл DOC, DOCX, PDF, TXT, JPG, JPEG або PNG.",
        tooLarge: "«big.jpeg»: файл перевищує максимальний розмір 10 МБ.",
        noText: "«empty.pdf»: немає тексту для пояснення.",
      },
    } as const;

    if (!i18n.isInitialized) await i18n.init();

    try {
      for (const language of ["pl", "en", "uk"] as const) {
        await i18n.changeLanguage(language);
        expect(
          explainErrorMessage(
            new TranslatedError("errors.unsupportedType", { name: "scan.png" }),
          ),
        ).toBe(messages[language].unsupportedType);
        expect(
          explainErrorMessage(
            new TranslatedError("errors.tooLarge", {
              name: "big.jpeg",
              maxSize: MAX_DOCUMENT_SIZE_MB,
            }),
          ),
        ).toBe(messages[language].tooLarge);
        expect(
          explainErrorMessage(
            new TranslatedError("errors.noText", { name: "empty.pdf" }),
          ),
        ).toBe(messages[language].noText);
      }
    } finally {
      await i18n.changeLanguage("pl");
    }
  });
});
