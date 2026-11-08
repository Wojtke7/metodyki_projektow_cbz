import { useRef, useState } from "react";

import { DocumentAttachmentsState } from "@/components/DocumentAttachmentsState";
import { DocumentUploadState } from "@/components/DocumentUploadState";
import { Header } from "@/components/Header";
import { MainNav, type MainSection } from "@/components/MainNav";
import { DOCUMENT_EXTENSIONS, validateDocuments } from "@/lib/documents";
import { cn } from "@/lib/utils";

export function Main() {
  const [activeSection, setActiveSection] = useState<MainSection>("documents");
  const [documents, setDocuments] = useState<File[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadState = activeSection === "documents" && documents.length === 0;

  const addDocuments = (files: File[]) => {
    if (files.length === 0) return;

    const { accepted, errors } = validateDocuments(files);
    if (accepted.length > 0) {
      setDocuments((previous) => [...previous, ...accepted]);
    }
    setUploadErrors(errors);
  }

  return (
    <div className="flex h-svh min-h-[600px] flex-col">
      <Header />
      <main className="grid min-h-0 flex-1 grid-cols-[72px_minmax(0,1440px)] grid-rows-1 justify-center gap-3 px-3 pb-6 sm:grid-cols-[88px_minmax(0,1440px)_88px] sm:gap-6 sm:px-4">
        <MainNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <section
          id="main-content"
          aria-labelledby="main-content-title"
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
            "flex min-w-0 overflow-hidden rounded-[24px] bg-card text-card-foreground",
            isUploadState
              ? "w-full max-w-[680px] self-center justify-self-center border-2 border-dashed px-4 py-10 sm:px-8 sm:py-12"
              : "min-h-[480px] border",
            activeSection !== "documents" &&
              "items-center justify-center px-4 py-10",
          )}
        >
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
          {activeSection === "documents" ? (
            documents.length > 0 ? (
              <DocumentAttachmentsState
                documents={documents}
                onAddDocuments={() => fileInputRef.current?.click()}
                errors={uploadErrors}
              />
            ) : (
              <DocumentUploadState
                onAddDocuments={() => fileInputRef.current?.click()}
                errors={uploadErrors}
              />
            )
          ) : (
            <h2 id="main-content-title" className="text-lg sm:text-[22px]">
              {activeSection === "section-2" ? "Sekcja 2" : "Sekcja 3"}
            </h2>
          )}
        </section>
      </main>
    </div>
  );
}
