import { Plus, X } from "lucide-react";
import { useEffect, useRef } from "react";

import { DocumentCard } from "@/components/DocumentCard";
import { DocumentUploadInfo } from "@/components/DocumentUploadInfo";
import { Button } from "@/components/ui/button";

type DocumentDrawerProps = {
  open: boolean;
  documents: File[];
  errors: string[];
  onClose: () => void;
  onAddDocuments: () => void;
};

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

export function DocumentDrawer({
  open,
  documents,
  errors,
  onClose,
  onAddDocuments,
}: DocumentDrawerProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previouslyFocused = document.activeElement;
    closeRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab" || !dialogRef.current) return;

      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={dialogRef}
        id="document-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="document-drawer-title"
        className="absolute inset-y-0 left-0 flex w-[min(480px,calc(100%-28px))] flex-col rounded-r-[28px] bg-card pt-[max(1.25rem,env(safe-area-inset-top))] text-card-foreground shadow-xl"
      >
        <div className="flex items-center justify-between gap-3 px-5 pb-4">
          <h2 id="document-drawer-title" className="text-[22px]">
            Dokumenty
          </h2>
          <Button
            ref={closeRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Zamknij"
            onClick={onClose}
            className="rounded-full"
          >
            <X aria-hidden="true" className="size-6" />
          </Button>
        </div>
        {errors.length > 0 && (
          <div className="px-5 pb-4">
            <DocumentUploadInfo errors={errors} showRequirements={false} />
          </div>
        )}
        <ul
          aria-label="Dodane dokumenty"
          className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pb-4"
        >
          {documents.map((file, index) => (
            <li key={index} className="min-w-0">
              <DocumentCard file={file} number={index + 1} variant="sheet" />
            </li>
          ))}
        </ul>
        <div className="px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            aria-describedby="document-upload-requirements"
            onClick={onAddDocuments}
            className="h-12 w-full rounded-2xl bg-card text-[16px] font-bold text-primary"
          >
            <Plus aria-hidden="true" className="size-5" />
            Dodaj dokument
          </Button>
        </div>
      </div>
    </div>
  );
}
