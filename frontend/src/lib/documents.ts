export const DOCUMENT_EXTENSIONS = [".docx", ".pdf", ".txt"];
export const MAX_DOCUMENT_SIZE_MB = 10;

export type DocumentUploadError =
  | { key: "errors.unsupportedType"; name: string }
  | { key: "errors.tooLarge"; name: string; maxSize: number };

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
