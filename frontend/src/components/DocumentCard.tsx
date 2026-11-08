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

  if (variant === "sheet") {
    return (
      <article
        aria-hidden={compact || undefined}
        className={cn(
          "min-w-0 border",
          compact ? "rounded-[10px] p-1.5" : "rounded-[16px] p-3",
        )}
      >
        <div
          aria-hidden="true"
          className={cn(
            "relative flex min-w-0 flex-col overflow-hidden bg-muted",
            compact
              ? "h-[76px] rounded-[8px] p-1.5"
              : "h-[140px] rounded-[12px] p-3",
          )}
        >
          <div className="flex items-start justify-between gap-1">
            <span
              className={cn(
                "relative z-10 flex shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground",
                compact ? "size-4 text-[9px]" : "size-7 text-[13px]",
              )}
            >
              {number}
            </span>
            <span
              className={cn(
                "shrink-0 text-muted-foreground",
                compact ? "text-[8px]" : "text-[12px]",
              )}
            >
              {extension}
            </span>
          </div>
          <p
            className={cn(
              "font-bold wrap-anywhere",
              compact
                ? "mt-1 line-clamp-2 text-[9px] leading-[12px]"
                : "mt-3 line-clamp-2 text-[15px] leading-5",
            )}
          >
            {title}
          </p>
          <div
            className={cn(
              "mt-auto flex flex-col pt-1",
              compact ? "gap-[3px]" : "gap-[5px]",
            )}
          >
            <span className="h-[3px] w-[88%] rounded-full bg-border" />
            <span className="h-[3px] w-[96%] rounded-full bg-border" />
            <span className="h-[3px] w-[73%] rounded-full bg-border" />
          </div>
          {extension === "PDF" && <PdfThumbnail file={file} />}
        </div>
        {compact ? (
          <p
            title={file.name}
            className="mt-1 truncate text-[10px] leading-[14px] font-bold"
          >
            {file.name}
          </p>
        ) : (
          <h3 title={file.name} className="mt-3 truncate text-[15px] leading-5">
            {file.name}
          </h3>
        )}
        <p
          className={cn(
            "text-muted-foreground",
            compact
              ? "mt-0.5 text-[9px] leading-[12px]"
              : "mt-1 text-[12px] leading-[18px]",
          )}
        >
          {size} · dokument {number}
        </p>
      </article>
    );
  }

  return (
    <article className="min-w-0 rounded-[16px] border p-3">
      <div
        aria-hidden="true"
        className="relative flex h-38 min-w-0 flex-col overflow-hidden rounded-[8px] bg-muted p-3"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="line-clamp-2 text-[14px] leading-[22px] font-bold wrap-anywhere">
            {title}
          </span>
          <span className="shrink-0 text-[12px] text-muted-foreground">
            {extension}
          </span>
        </div>
        <div className="mt-auto flex flex-col gap-[5px] pt-[6px]">
          <span className="h-[3px] w-[88%] rounded-full bg-border" />
          <span className="h-[3px] w-[96%] rounded-full bg-border" />
          <span className="h-[3px] w-[73%] rounded-full bg-border" />
        </div>
        {extension === "PDF" && <PdfThumbnail file={file} />}
      </div>
      <h3
        title={file.name}
        className="mt-[12px] truncate text-[14px] leading-[20px]"
      >
        {file.name}
      </h3>
      <div className="mt-[10px] flex items-center justify-between gap-2">
        <p className="text-[12px] leading-[18px] text-muted-foreground">
          {size}
        </p>
        <span
          aria-label={`Dokument ${number}`}
          className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-[14px] font-bold text-primary-foreground"
        >
          {number}
        </span>
      </div>
    </article>
  );
}
