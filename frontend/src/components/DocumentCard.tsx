import { PdfThumbnail } from "@/components/PdfThumbnail";

type DocumentCardProps = {
  file: File;
  number: number;
};

export function DocumentCard({ file, number }: DocumentCardProps) {
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
