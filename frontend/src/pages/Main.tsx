import { useCallback, useEffect, useRef, useState } from "react";

import {
  DocumentAttachmentsState,
  type DocumentExplanationStatus,
} from "@/components/DocumentAttachmentsState";
import { DocumentDrawer } from "@/components/DocumentDrawer";
import { DocumentUploadState } from "@/components/DocumentUploadState";
import { Header } from "@/components/Header";
import { MainNav, type MainSection } from "@/components/MainNav";
import {
  DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_MB,
  validateDocuments,
} from "@/lib/documents";
import { cn } from "@/lib/utils";

export function Main() {
  const [activeSection, setActiveSection] = useState<MainSection>("documents");
  const [documents, setDocuments] = useState<File[]>([]);
  const [documentsOpen, setDocumentsOpen] = useState(false);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const [explanationStatus, setExplanationStatus] =
    useState<DocumentExplanationStatus>("ready");
  const explanationTimerRef = useRef<number | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadState = activeSection === "documents" && documents.length === 0;
  const showDocumentDrawerButton =
    activeSection === "documents" && documents.length > 0;

  useEffect(() => () => window.clearTimeout(explanationTimerRef.current), []);

  const closeDocuments = useCallback(() => setDocumentsOpen(false), []);

  const explainDocuments = () => {
    if (documents.length === 0 || explanationStatus === "loading") return;

    setExplanationStatus("loading");
    explanationTimerRef.current = window.setTimeout(() => {
      setExplanationStatus("explained");
      explanationTimerRef.current = undefined;
    }, 5200);
  };

  const addDocuments = (files: File[]) => {
    if (files.length === 0) return;

    const { accepted, errors } = validateDocuments(files);
    if (accepted.length > 0) {
      window.clearTimeout(explanationTimerRef.current);
      explanationTimerRef.current = undefined;
      setExplanationStatus("ready");
      setDocuments((previous) => [...previous, ...accepted]);
    }
    setUploadErrors(errors);
  };

  return (
    <>
      <p id="document-upload-requirements" className="sr-only">
        Dozwolone formaty: {DOCUMENT_EXTENSIONS.join(", ").toUpperCase()}.
        Maksymalny rozmiar pliku: {MAX_DOCUMENT_SIZE_MB} MB.
      </p>
      <input
        ref={fileInputRef}
        type="file"
        accept={DOCUMENT_EXTENSIONS.join(",")}
        multiple
        aria-label="Dodaj dokumenty"
        aria-describedby="document-upload-requirements"
        className="hidden"
        onChange={(event) => {
          addDocuments(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />
      <div
        inert={documentsOpen || undefined}
        className="mx-auto flex h-dvh max-w-[1720px] flex-col overflow-hidden lg:h-svh lg:min-h-[600px] lg:overflow-visible"
      >
        <Header
          documentsOpen={documentsOpen}
          onOpenDocuments={
            showDocumentDrawerButton ? () => setDocumentsOpen(true) : undefined
          }
        />
        <main className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5 lg:grid lg:grid-cols-[88px_minmax(0,1fr)] lg:gap-6 lg:px-8 lg:pb-6">
          <MainNav
            activeSection={activeSection}
            onSectionChange={(section) => {
              setActiveSection(section);
              if (section !== "documents") setDocumentsOpen(false);
            }}
          />
          <section
            id="main-content"
            aria-labelledby={
              activeSection === "documents" && documents.length > 0
                ? undefined
                : "main-content-title"
            }
            aria-label={
              activeSection === "documents" && documents.length > 0
                ? "Dokumenty"
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
                ? "reading-surface my-auto max-h-full flex-initial items-center overflow-y-auto rounded-[24px] px-5 py-8 sm:px-10 sm:py-12 lg:my-0 lg:w-full lg:max-w-[720px] lg:self-center lg:justify-self-center lg:py-14"
                : "flex-1 lg:min-h-[480px]",
              activeSection !== "documents" &&
                "reading-surface items-center justify-center rounded-[24px] px-4 py-10",
            )}
          >
            {activeSection === "documents" ? (
              documents.length > 0 ? (
                <DocumentAttachmentsState
                  documents={documents}
                  onAddDocuments={() => fileInputRef.current?.click()}
                  errors={uploadErrors}
                  explanationStatus={explanationStatus}
                  onExplainDocuments={explainDocuments}
                />
              ) : (
                <DocumentUploadState
                  onAddDocuments={() => fileInputRef.current?.click()}
                  errors={uploadErrors}
                />
              )
            ) : (
              <h2 id="main-content-title" className="text-lg lg:text-[22px]">
                {activeSection === "section-2" ? "Sekcja 2" : "Sekcja 3"}
              </h2>
            )}
          </section>
        </main>
      </div>
      <DocumentDrawer
        open={documentsOpen}
        documents={documents}
        errors={uploadErrors}
        onClose={closeDocuments}
        onAddDocuments={() => fileInputRef.current?.click()}
      />
    </>
  );
}
