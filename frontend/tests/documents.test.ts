import { describe, expect, test } from "bun:test";

import {
  MAX_DOCUMENT_SIZE_MB,
  validateDocuments,
} from "../src/lib/documents";

describe("document upload validation", () => {
  test("accepts DOCX, PDF, and TXT files, including uppercase extensions", () => {
    const files = [
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

  test("rejects legacy DOC files", () => {
    const file = new File(["document"], "pismo.doc");
    expect(validateDocuments([file])).toEqual({
      accepted: [],
      errors: [{ key: "errors.unsupportedType", name: file.name }],
    });
  });

  test("applies the size limit per file rather than to the whole selection", () => {
    const files = ["pierwszy.docx", "drugi.pdf"].map(
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
