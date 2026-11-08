import { DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE_MB } from "@/lib/documents";

export function DocumentUploadInfo({ errors }: { errors: string[] }) {
  return (
    <div className="min-w-0 text-[13px] leading-relaxed text-muted-foreground">
      <p id="document-upload-requirements">
        Dozwolone formaty: {DOCUMENT_EXTENSIONS.join(", ").toUpperCase()}
        <br />
        Maksymalny rozmiar pliku: {MAX_DOCUMENT_SIZE_MB} MB
      </p>
      {errors.length > 0 && (
        <ul
          role="alert"
          aria-label="Nie dodano niektórych plików"
          className="mt-2 max-h-[100px] overflow-y-auto text-destructive"
        >
          {errors.map((error, index) => (
            <li key={index} className="wrap-anywhere">
              {error}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
