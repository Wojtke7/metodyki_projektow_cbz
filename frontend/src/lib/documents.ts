export const DOCUMENT_EXTENSIONS = [".doc", ".docx", ".pdf"];
export const MAX_DOCUMENT_SIZE_MB = 10;

export function validateDocuments(files: File[]) {
  const accepted: File[] = [];
  const errors: string[] = [];

  for (const file of files) {
    if (
      !DOCUMENT_EXTENSIONS.some((extension) =>
        file.name.toLowerCase().endsWith(extension),
      )
    ) {
      errors.push(`„${file.name}”: wybierz plik DOC, DOCX lub PDF.`);
    } else if (file.size > MAX_DOCUMENT_SIZE_MB * 1024 * 1024) {
      errors.push(
        `„${file.name}”: plik przekracza maksymalny rozmiar ${MAX_DOCUMENT_SIZE_MB} MB.`,
      );
    } else {
      accepted.push(file);
    }
  }

  return { accepted, errors };
}
