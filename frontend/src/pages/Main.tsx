import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import type { DocumentExplanation } from "@/api/explain";
import {
  DocumentAttachmentsState,
  type DocumentExplanationStatus,
} from "@/components/DocumentAttachmentsState";
import { DocumentDrawer } from "@/components/DocumentDrawer";
import { DocumentUploadState } from "@/components/DocumentUploadState";
import { Header } from "@/components/Header";
import { MainNav, type MainSection } from "@/components/MainNav";
import {
  explainErrorMessage,
  useExplainDocuments,
} from "@/hooks/useExplainDocuments";
import {
  DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_MB,
  validateDocuments,
  type DocumentUploadError,
} from "@/lib/documents";
import { cn } from "@/lib/utils";

export function Main() {
  const { i18n, t } = useTranslation();
  const currentLanguage = i18n.resolvedLanguage ?? "pl";
  const [activeSection, setActiveSection] = useState<MainSection>("documents");
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<DocumentUploadError[]>([]);
  const explainDocuments = useExplainDocuments();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [navExpanded, setNavExpanded] = useState(true);
  const isUploadState = activeSection === "documents" && documents.length === 0;
  const showDocumentDrawerButton =
    activeSection === "documents" && documents.length > 0;

  // Cache explanations per language so switching between PL / EN / UK is instant if already loaded
  const [explanationsByLang, setExplanationsByLang] = useState<
    Record<string, DocumentExplanation[]>
  >({});

  // Store explanations explicitly keyed by the language returned by the mutation
  useEffect(() => {
    if (explainDocuments.isSuccess && explainDocuments.data) {
      const { language, explanations } = explainDocuments.data;
      setExplanationsByLang((previous) => ({
        ...previous,
        [language]: explanations,
      }));
    }
  }, [explainDocuments.isSuccess, explainDocuments.data]);

  const activeExplanations =
    explanationsByLang[currentLanguage] ??
    (explainDocuments.data?.language === currentLanguage
      ? explainDocuments.data.explanations
      : []);

  const hasExplanations =
    Object.keys(explanationsByLang).length > 0 || explainDocuments.isSuccess;

  const closeDocuments = useCallback(() => setDocumentsOpen(false), []);
  const explanationStatus: DocumentExplanationStatus =
    explainDocuments.isPending
      ? "loading"
      : hasExplanations && activeExplanations.length > 0
        ? "explained"
        : hasExplanations && !explanationsByLang[currentLanguage]
          ? "loading"
          : "ready";
  const isReadingState =
    activeSection === "documents" && explanationStatus === "explained";

  // Re-fetch explanation automatically when user switches language in explained view
  const previousLanguageRef = useRef(currentLanguage);
  useEffect(() => {
    if (previousLanguageRef.current !== currentLanguage) {
      previousLanguageRef.current = currentLanguage;
      if (
        hasExplanations &&
        documents.length > 0 &&
        !explanationsByLang[currentLanguage] &&
        !explainDocuments.isPending
      ) {
        explainDocuments.mutate({
          files: documents,
          language: currentLanguage,
        });
      }
    }
  }, [
    currentLanguage,
    hasExplanations,
    documents,
    explanationsByLang,
    explainDocuments,
  ]);

  const visibleErrors = [
    ...uploadErrors.map((error) =>
      t(error.key, {
        name: error.name,
        maxSize: error.key === "errors.tooLarge" ? error.maxSize : undefined,
      }),
    ),
    ...(explainDocuments.isError
      ? [explainErrorMessage(explainDocuments.error)]
      : []),
  ];

  const addDocuments = (files: File[]) => {
    if (files.length === 0) return;

    const { accepted, errors } = validateDocuments(files);
    if (accepted.length > 0) {
      explainDocuments.reset();
      setExplanationsByLang({});
      setDocuments((previous) => [...previous, ...accepted]);
    }
    setUploadErrors(errors);
  };

  return (
    <>
      <p id="document-upload-requirements" className="sr-only">
        {`${t("upload.formats", {
          formats: DOCUMENT_EXTENSIONS.join(", ").toUpperCase(),
        })}. ${t("upload.maxSize", { maxSize: MAX_DOCUMENT_SIZE_MB })}.`}
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_EXTENSIONS.join(",")}
        multiple
        aria-label={t("upload.addDocuments")}
        aria-describedby="document-upload-requirements"
        className="hidden"
        onChange={(event) => {
          addDocuments(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <div
        inert={documentsOpen || undefined}
        className={cn(
          "flex min-h-dvh flex-col gap-3 lg:h-dvh lg:min-h-0 lg:flex-row lg:gap-6 lg:overflow-hidden lg:py-6 lg:pl-3",
          isReadingState && "h-dvh min-h-0 overflow-hidden",
        )}
      >
        <MainNav
          activeSection={activeSection}
          expanded={navExpanded}
          onExpandedChange={setNavExpanded}
          onSectionChange={(section) => {
            setActiveSection(section);
            if (section !== "documents") setDocumentsOpen(false);
          }}
        />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header
            documentsOpen={documentsOpen}
            onOpenDocuments={
              showDocumentDrawerButton
                ? () => setDocumentsOpen(true)
                : undefined
            }
          />
          <main
            className={cn(
              "flex min-h-0 flex-1 flex-col gap-3 px-4 pb-8 sm:px-5 lg:px-0 lg:pr-8 lg:pb-0",
              isReadingState && "pb-0",
            )}
          >
            <section
              id="main-content"
              aria-labelledby={
                activeSection === "documents" && documents.length > 0
                  ? undefined
                  : "main-content-title"
              }
              aria-label={
                activeSection === "documents" && documents.length > 0
                  ? t("nav.documents")
                  : undefined
              }
              onDragOver={(event) => {
                if (activeSection === "documents") {
                  event.preventDefault();
                  event.dataTransfer.dropEffect = "copy";
                }
              }}
              onDrop={(event) => {
                if (activeSection === "documents") {
                  event.preventDefault();
                  addDocuments(Array.from(event.dataTransfer.files));
                }
              }}
              className={cn(
                "order-first flex min-h-0 min-w-0 flex-col lg:order-none",
                isUploadState
                  ? "my-auto w-full max-w-[720px] flex-initial items-center self-center py-10 sm:py-12 lg:reading-surface lg:max-h-full lg:overflow-y-auto lg:rounded-[24px] lg:px-10 lg:py-14"
                  : "flex-1",
                activeSection !== "documents" &&
                  "items-center justify-center py-10 lg:reading-surface lg:rounded-[24px] lg:px-4",
              )}
            >
              {activeSection === "documents" ? (
                documents.length > 0 ? (
                  <DocumentAttachmentsState
                    documents={documents}
                    onAddDocuments={() => fileInputRef.current?.click()}
                    errors={visibleErrors}
                    explanations={activeExplanations}
                    explanationStatus={explanationStatus}
                    onExplainDocuments={() =>
                      explainDocuments.mutate({
                        files: documents,
                        language: currentLanguage,
                      })
                    }
                  />
                ) : (
                  <DocumentUploadState
                    onAddDocuments={() => fileInputRef.current?.click()}
                    errors={visibleErrors}
                  />
                )
              ) : (
                <h2 id="main-content-title" className="text-lg lg:text-[22px]">
                  {activeSection === "section-2"
                    ? t("nav.section2")
                    : t("nav.section3")}
                </h2>
              )}
            </section>
          </main>
        </div>
      </div>
      <DocumentDrawer
        open={documentsOpen}
        documents={documents}
        errors={visibleErrors}
        onClose={closeDocuments}
        onAddDocuments={() => fileInputRef.current?.click()}
      />
    </>
  );
}
