import { DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE_MB } from "@/lib/documents";

export function DocumentUploadInfo({
  errors,
  showRequirements = true,
}: {
  errors: string[];
  showRequirements?: boolean;
}) {
  if (!showRequirements && errors.length === 0) return null;

  return (
    <div className="min-w-0 text-[13px] leading-relaxed text-muted-foreground">
      {showRequirements && (
        <p aria-hidden="true">
          Dozwolone formaty: {DOCUMENT_EXTENSIONS.join(", ").toUpperCase()}
          <br />
          Maksymalny rozmiar pliku: {MAX_DOCUMENT_SIZE_MB} MB
        </p>
      )}
      {errors.length > 0 && (
        <ul
          role="alert"
          aria-label="Nie dodano niektórych plików"
          className="upload-errors mt-2 max-h-[120px] overflow-y-auto rounded-xl px-3 py-2 text-left text-destructive"
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
