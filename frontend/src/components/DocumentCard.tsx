import { FileText, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import { PdfThumbnail } from "@/components/PdfThumbnail";
import { cn } from "@/lib/utils";

type DocumentCardProps = {
  file: File;
  number: number;
  variant?: "grid" | "sheet";
  compact?: boolean;
  onRemove?: () => void;
  removeDisabled?: boolean;
};

export function DocumentCard({
  file,
  number,
  variant = "grid",
  compact = false,
  onRemove,
  removeDisabled = false,
}: DocumentCardProps) {
  const { t, i18n } = useTranslation();
  const extension = file.name.includes(".")
    ? file.name.split(".").at(-1)?.toUpperCase()
    : t("document.file");
  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const size = new Intl.NumberFormat(i18n.language, {
    style: "unit",
    unit: file.size < 1024 * 1024 ? "kilobyte" : "megabyte",
    maximumFractionDigits: 1,
  }).format(file.size / (file.size < 1024 * 1024 ? 1024 : 1024 * 1024));

  return (
    <article
      aria-hidden={compact || undefined}
      aria-label={
        compact ? undefined : t("document.label", { number, name: file.name })
      }
      className="min-w-0"
    >
      <div className="relative">
        <div
          aria-hidden="true"
          className={cn(
            "document-paper relative aspect-[210/297] w-full overflow-hidden",
            compact ? "rounded-[8px]" : "rounded-xl",
          )}
        >
          <FileText
            aria-hidden="true"
            className={cn(
              "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted-foreground",
              compact ? "size-5" : "size-8",
            )}
          />
          {extension === "PDF" && <PdfThumbnail file={file} />}
          <span
            className={cn(
              "absolute right-1.5 bottom-1.5 z-10 flex items-center justify-center rounded-full bg-primary font-bold text-primary-foreground",
              compact ? "size-4 text-[9px]" : "size-6 text-[13px]",
            )}
          >
            {number}
          </span>
        </div>
        {!compact && onRemove && (
          <button
            type="button"
            disabled={removeDisabled}
            aria-label={t("document.remove", { name: file.name })}
            title={t("document.remove", { name: file.name })}
            onClick={onRemove}
            className={cn(
              "ui-button button-raised absolute top-2 right-2 z-10 flex cursor-pointer items-center justify-center rounded-full border text-muted-foreground outline-none hover:text-destructive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50",
              variant === "sheet" ? "size-9" : "size-8",
            )}
          >
            <Trash2 aria-hidden="true" className="size-4" />
          </button>
        )}
      </div>
      {compact ? (
        <p
          title={file.name}
          className="mt-1 truncate text-[11px] leading-[14px] font-bold"
        >
          {title}
        </p>
      ) : (
        <h3
          title={file.name}
          className={cn(
            "truncate",
            variant === "sheet"
              ? "mt-3 text-[16px] leading-5"
              : "mt-3 text-[15px] leading-5",
          )}
        >
          {title}
        </h3>
      )}
      <div className="flex items-center justify-between">
        <p
          className={cn(
            "text-muted-foreground",
            compact
              ? "text-[10px] leading-[12px]"
              : "text-[14px] leading-[18px]",
          )}
        >
          {size}
        </p>
        <p
          className={cn(
            "font-bold tracking-wide text-muted-foreground uppercase",
            compact
              ? "text-[10px] leading-[12px]"
              : "text-[14px] leading-[18px]",
          )}
        >
          {extension}
        </p>
      </div>
    </article>
  );
}
