import { FileUp, Upload } from "lucide-react";

import { DocumentUploadInfo } from "@/components/DocumentUploadInfo";
import { Button } from "@/components/ui/button";

type DocumentUploadStateProps = {
  onAddDocuments: () => void;
  errors: string[];
};

export function DocumentUploadState({
  onAddDocuments,
  errors,
}: DocumentUploadStateProps) {
  return (
    <div className="flex w-full flex-col items-center gap-[20px] text-center">
      <FileUp aria-hidden="true" className="size-[64px] text-primary" />
      <div className="w-full max-w-[420px]">
        <h2
          id="main-content-title"
          className="text-[20px] leading-snug sm:text-[24px]"
        >
          Upuść pliki tutaj, aby przesłać
        </h2>
        <div
          aria-hidden="true"
          className="mt-[12px] flex items-center gap-[16px] text-[18px] text-muted-foreground"
        >
          <span className="h-px flex-1 bg-border" />
          lub
          <span className="h-px flex-1 bg-border" />
        </div>
      </div>
      <Button
        type="button"
        onClick={onAddDocuments}
        aria-describedby="document-upload-requirements"
        className="min-h-[56px] w-full max-w-[360px] gap-3 rounded-full px-3 py-3 text-[14px] font-bold whitespace-normal sm:px-6 sm:text-[18px]"
      >
        <Upload aria-hidden="true" className="hidden size-[24px] sm:block" />
        Prześlij z urządzenia
      </Button>
      <DocumentUploadInfo errors={errors} />
    </div>
  );
}
