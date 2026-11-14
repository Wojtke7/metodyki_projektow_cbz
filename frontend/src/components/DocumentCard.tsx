import { FileText } from "lucide-react";

import { PdfThumbnail } from "@/components/PdfThumbnail";
import { cn } from "@/lib/utils";

type DocumentCardProps = {
  file: File;
  number: number;
  variant?: "grid" | "sheet";
  compact?: boolean;
};

export function DocumentCard({
  file,
  number,
  variant = "grid",
  compact = false,
}: DocumentCardProps) {
  const extension = file.name.includes(".")
    ? file.name.split(".").at(-1)?.toUpperCase()
    : "PLIK";
  const title = file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const size = new Intl.NumberFormat("pl-PL", {
    style: "unit",
    unit: file.size < 1024 * 1024 ? "kilobyte" : "megabyte",
    maximumFractionDigits: 1,
  }).format(file.size / (file.size < 1024 * 1024 ? 1024 : 1024 * 1024));

  return (
    <article
      aria-hidden={compact || undefined}
      aria-label={compact ? undefined : `Dokument ${number}: ${file.name}`}
      className="min-w-0"
    >
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
