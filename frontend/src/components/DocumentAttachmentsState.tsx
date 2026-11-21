import { Plus } from "lucide-react";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";

import type { DocumentExplanation } from "@/api/explain";
import { DocumentCard } from "@/components/DocumentCard";
import { DocumentExplainedState } from "@/components/DocumentExplainedState";
import { DocumentExplanationReadyState } from "@/components/DocumentExplanationReadyState";
import { DocumentUploadInfo } from "@/components/DocumentUploadInfo";
import { Button } from "@/components/ui/button";

const DocumentExplanationLoadingState = lazy(() =>
  import("@/components/DocumentExplanationLoadingState").then((module) => ({
    default: module.DocumentExplanationLoadingState,
  })),
);

export type DocumentExplanationStatus = "ready" | "loading" | "explained";

type DocumentAttachmentsStateProps = {
  documents: File[];
  onAddDocuments: () => void;
  onRemoveDocument: (index: number) => void;
  errors: string[];
  explanations: DocumentExplanation[];
  explanationStatus: DocumentExplanationStatus;
  onExplainDocuments: () => void;
};

export function DocumentAttachmentsState({
  documents,
  onAddDocuments,
  onRemoveDocument,
  errors,
  explanations,
  explanationStatus,
  onExplainDocuments,
}: DocumentAttachmentsStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col gap-4 lg:flex-row lg:gap-5">
      {errors.length > 0 && (
        <div className="shrink-0 lg:hidden">
          <DocumentUploadInfo errors={errors} showRequirements={false} />
        </div>
      )}
      <div className="glass-surface hidden min-h-0 min-w-0 flex-col rounded-[24px] p-5 lg:flex lg:w-2/5 lg:max-w-[456px] lg:flex-none">
        <div className="mb-[16px] flex shrink-0 items-center justify-between gap-3">
          <h2 id="main-content-title" className="text-[20px]">
            {t("nav.documents")}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label={t("upload.addDocuments")}
            aria-describedby="document-upload-requirements"
            onClick={onAddDocuments}
            className="size-10 rounded-xl text-primary"
          >
            <Plus aria-hidden="true" className="size-[24px]" />
          </Button>
        </div>
        <div className="mb-5 shrink-0">
          <DocumentUploadInfo errors={errors} />
        </div>
        <ul
          aria-label={t("upload.addedDocuments")}
          className="styled-scrollbar -mr-5 grid min-h-0 flex-1 grid-cols-[repeat(auto-fill,minmax(min(100%,172px),1fr))] content-start gap-4 overflow-y-auto py-0.5 pr-5 pl-0.5"
        >
          {documents.map((file, index) => (
            <li key={index} className="min-w-0">
              <DocumentCard
                file={file}
                number={index + 1}
                onRemove={() => onRemoveDocument(index)}
                removeDisabled={explanationStatus === "loading"}
              />
            </li>
          ))}
        </ul>
        {explanationStatus !== "explained" && (
          <div className="shrink-0 pt-[24px]">
            <Button
              type="button"
              onClick={onExplainDocuments}
              disabled={explanationStatus === "loading"}
              className="min-h-12 w-full rounded-2xl px-3 py-3 text-[15px] font-bold whitespace-normal"
            >
              {explanationStatus === "loading"
                ? t("explain.pending")
                : t("explain.action")}
            </Button>
          </div>
        )}
      </div>
      {explanationStatus === "ready" && (
        <DocumentExplanationReadyState
          onExplainDocuments={onExplainDocuments}
        />
      )}
      {explanationStatus === "loading" && (
        <Suspense
          fallback={
            <div
              role="status"
              className="flex flex-1 items-center justify-center py-8 lg:reading-surface lg:min-h-0 lg:rounded-[24px] lg:p-6"
            >
              {t("explain.pending")}
            </div>
          }
        >
          <DocumentExplanationLoadingState />
        </Suspense>
      )}
      {explanationStatus === "explained" && (
        <DocumentExplainedState
          documents={documents}
          explanations={explanations}
        />
      )}
    </div>
  );
}
