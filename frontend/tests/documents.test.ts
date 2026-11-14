import { describe, expect, test } from "bun:test";

import { validateDocuments } from "../src/lib/documents";

describe("document upload validation", () => {
  test("accepts Word and PDF files, including uppercase extensions and empty MIME types", () => {
    const files = [
      "pismo.doc",
      "wniosek.docx",
      "decyzja.pdf",
      "PISMO.DOCX",
      "DECYZJA.PDF",
    ].map((name) => new File(["document"], name));

    expect(validateDocuments(files)).toEqual({ accepted: files, errors: [] });
  });

  test("rejects unsupported files, missing extensions, and disguised extensions", () => {
    const files = [
      "zdjęcie.png",
      "notatka.txt",
      "dokument",
      "decyzja.pdf.exe",
    ].map((name) => new File(["document"], name));
    const result = validateDocuments(files);

    expect(result.accepted).toEqual([]);
    expect(result.errors).toHaveLength(4);
    files.forEach((file, index) => {
      expect(result.errors[index]).toContain(file.name);
      expect(result.errors[index]).toContain("DOC, DOCX lub PDF");
    });
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
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("za-duży.pdf");
    expect(result.errors[0]).toContain("10 MB");
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
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain("zdjęcie.jpg");
  });

  test("handles an empty selection without errors", () => {
    expect(validateDocuments([])).toEqual({ accepted: [], errors: [] });
  });
});
