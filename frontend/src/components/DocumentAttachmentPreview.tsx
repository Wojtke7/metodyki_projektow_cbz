import { FileText } from "lucide-react";

import { PdfThumbnail } from "@/components/PdfThumbnail";

type DocumentAttachmentPreviewProps = {
  file: File;
  number: number;
};

export function DocumentAttachmentPreview({
  file,
  number,
}: DocumentAttachmentPreviewProps) {
  return (
    <figure
      aria-label={`Podgląd dokumentu ${number}`}
      className="document-paper relative flex aspect-[3/4] w-full items-center justify-center overflow-hidden rounded-xl"
    >
      <FileText
        aria-hidden="true"
        className="size-[32px] text-muted-foreground"
      />
      {file.name.toLowerCase().endsWith(".pdf") && <PdfThumbnail file={file} />}
      <span className="absolute right-[6px] bottom-[6px] flex size-[20px] items-center justify-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
        {number}
      </span>
    </figure>
  );
}
