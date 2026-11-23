export const DOCUMENT_EXTENSIONS = [".doc", ".docx", ".pdf", ".txt"];
export const MAX_DOCUMENT_SIZE_MB = 10;

export type DocumentUploadError =
  | { key: "errors.unsupportedType"; name: string }
  | { key: "errors.tooLarge"; name: string; maxSize: number };

export class TranslatedError extends Error {
  readonly key: "errors.pdfOnly" | "errors.noText";
  readonly values: { name: string };

  constructor(key: TranslatedError["key"], values: { name: string }) {
    super(key);
    this.name = "TranslatedError";
    this.key = key;
    this.values = values;
  }
}

export function validateDocuments(files: File[]) {
  const accepted: File[] = [];
  const errors: DocumentUploadError[] = [];

  for (const file of files) {
    if (
      !DOCUMENT_EXTENSIONS.some((extension) =>
        file.name.toLowerCase().endsWith(extension),
      )
    ) {
      errors.push({ key: "errors.unsupportedType", name: file.name });
    } else if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
      errors.push({
        key: "errors.tooLarge",
        name: file.name,
        maxSize: MAX_DOCUMENT_SIZE_MB,
      });
    } else {
      accepted.push(file);
    }
  }

  return { accepted, errors };
}

export async function readDocumentText(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt")) return (await file.text()).trim();
  if (!name.endsWith(".pdf")) {
    throw new TranslatedError("errors.pdfOnly", { name: file.name });
  }

  const [{ getDocument, GlobalWorkerOptions }, worker] = await Promise.all([
    import("pdfjs-dist"),
    import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
  ]);
  GlobalWorkerOptions.workerSrc = worker.default;
  const task = getDocument({
    data: new Uint8Array(await file.arrayBuffer()),
  });

  try {
    const pdf = await task.promise;
    const pages: string[] = [];
    for (let number = 1; number <= pdf.numPages; number += 1) {
      const page = await pdf.getPage(number);
      const content = await page.getTextContent();
      pages.push(
        content.items.map((item) => ("str" in item ? item.str : "")).join(" "),
      );
    }
    return pages.join("\n").trim();
  } finally {
    await task.destroy();
  }
}
