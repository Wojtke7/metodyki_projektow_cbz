export const DOCUMENT_EXTENSIONS = [
  ".doc",
  ".docx",
  ".pdf",
  ".txt",
  ".jpg",
  ".jpeg",
  ".png",
];
export const MAX_DOCUMENT_SIZE_MB = 10;

export type DocumentUploadError =
  | { key: "errors.unsupportedType"; name: string }
  | { key: "errors.tooLarge"; name: string; maxSize: number };

export type ExplainBackendErrorKey =
  "errors.unsupportedType" | "errors.tooLarge" | "errors.noText";

const EXPLAIN_BACKEND_ERROR_KEYS: Record<string, ExplainBackendErrorKey> = {
  wrong_type: "errors.unsupportedType",
  unsupported_type: "errors.unsupportedType",
  invalid_type: "errors.unsupportedType",
  invalid_file_type: "errors.unsupportedType",
  file_too_big: "errors.tooLarge",
  file_too_large: "errors.tooLarge",
  too_large: "errors.tooLarge",
  no_text: "errors.noText",
  empty_text: "errors.noText",
};

export class TranslatedError extends Error {
  readonly key: ExplainBackendErrorKey;
  readonly values: { name: string; maxSize?: number };

  constructor(
    key: TranslatedError["key"],
    values: { name: string; maxSize?: number },
  ) {
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

function explainErrorCode(value: unknown) {
  let raw: unknown = value;
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const record = value as { code?: unknown; error?: unknown };
    raw = record.code ?? record.error;
  }
  if (typeof raw !== "string") return null;

  const code = raw
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/[^a-z0-9_]+$/g, "");
  return code in EXPLAIN_BACKEND_ERROR_KEYS ? code : null;
}

function responseDetail(data: unknown) {
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "detail" in data
  ) {
    return (data as { detail: unknown }).detail;
  }
  return data;
}

export function explainBackendErrorKey(
  status: number | undefined,
  data: unknown,
) {
  const code = explainErrorCode(responseDetail(data)) ?? explainErrorCode(data);
  if (code) return EXPLAIN_BACKEND_ERROR_KEYS[code];
  if (status === 415) return "errors.unsupportedType";
  if (status === 413) return "errors.tooLarge";
  return null;
}
