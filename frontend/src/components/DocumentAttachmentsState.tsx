import { Plus } from "lucide-react";

import { DocumentCard } from "@/components/DocumentCard";
import { DocumentExplanationReadyState } from "@/components/DocumentExplanationReadyState";
import { DocumentUploadInfo } from "@/components/DocumentUploadInfo";
import { Button } from "@/components/ui/button";

type DocumentAttachmentsStateProps = {
  documents: File[];
  onAddDocuments: () => void;
  errors: string[];
};

export function DocumentAttachmentsState({
  documents,
  onAddDocuments,
  errors,
}: DocumentAttachmentsStateProps) {
  return (
    <div className="flex min-h-0 w-full min-w-0 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <div className="flex min-h-[480px] min-w-0 flex-1 flex-col p-[16px] sm:p-[24px] lg:min-h-0 lg:w-[456px] lg:flex-none lg:border-r">
        <div className="mb-[16px] flex shrink-0 items-center justify-between gap-3">
          <h2 id="main-content-title" className="text-[20px]">
            Dokumenty
          </h2>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Dodaj dokumenty"
            aria-describedby="document-upload-requirements"
            onClick={onAddDocuments}
            className="-mr-[4px] rounded-full text-primary"
          >
            <Plus aria-hidden="true" className="size-[24px]" />
          </Button>
        </div>
        <div className="mb-[20px] shrink-0">
          <DocumentUploadInfo errors={errors} />
        </div>
        <ul
          aria-label="Dodane dokumenty"
          className="grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(min(100%,172px),1fr))] content-start gap-[16px] overflow-y-auto"
        >
          {documents.map((file, index) => (
            <li key={index} className="min-w-0">
              <DocumentCard file={file} number={index + 1} />
            </li>
          ))}
        </ul>
        <div className="shrink-0 pt-[24px]">
          <Button
            type="button"
            className="h-[48px] w-full rounded-[12px] text-[16px] font-bold"
          >
            Wyjaśnij dokumenty
          </Button>
        </div>
      </div>
      <DocumentExplanationReadyState />
    </div>
  );
}
