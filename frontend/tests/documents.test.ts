import { describe, expect, test } from "bun:test";

import {
  MAX_DOCUMENT_SIZE_MB,
  readDocumentText,
  TranslatedError,
  validateDocuments,
} from "../src/lib/documents";

describe("document upload validation", () => {
  test("accepts Word, PDF, and TXT files, including uppercase extensions and empty MIME types", () => {
    const files = [
      "pismo.doc",
      "wniosek.docx",
      "decyzja.pdf",
      "notatka.txt",
      "PISMO.DOCX",
      "DECYZJA.PDF",
      "NOTATKA.TXT",
    ].map((name) => new File(["document"], name));

    expect(validateDocuments(files)).toEqual({ accepted: files, errors: [] });
  });

  test("rejects unsupported files, missing extensions, and disguised extensions", () => {
    const files = [
      "zdjęcie.png",
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
      "za-duży.pdf",
    );
    const result = validateDocuments([atLimit, overLimit]);

    expect(result.accepted).toEqual([atLimit]);
    expect(result.errors).toEqual([
      {
        key: "errors.tooLarge",
        name: "za-duży.pdf",
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
    const invalid = new File(["image"], "zdjęcie.jpg");
    const second = new File(["document"], "drugi.pdf");
    const result = validateDocuments([first, invalid, second]);

    expect(result.accepted).toEqual([first, second]);
    expect(result.errors).toEqual([
      { key: "errors.unsupportedType", name: "zdjęcie.jpg" },
    ]);
  });

  test("handles an empty selection without errors", () => {
    expect(validateDocuments([])).toEqual({ accepted: [], errors: [] });
  });
});

describe("document text", () => {
  test("reads TXT content, including Polish characters and uppercase extension", async () => {
    const text = "Zażółć gęślą jaźń.\nTermin: 7 dni.";
    const file = new File([text], "NOTATKA.TXT");

    expect(await readDocumentText(file)).toBe(text);
  });

  test("returns empty text for a blank TXT file", async () => {
    expect(await readDocumentText(new File(["  \n"], "pusta.txt"))).toBe("");
  });

  test("refuses Word files that cannot be read yet", async () => {
    const file = new File(["document"], "pismo.docx");

    await expect(readDocumentText(file)).rejects.toEqual(
      new TranslatedError("errors.pdfOnly", { name: file.name }),
    );
  });
});
