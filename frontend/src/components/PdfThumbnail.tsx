import type { PDFDocumentLoadingTask } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useState } from "react";

export function PdfThumbnail({ file }: { file: File }) {
  const [thumbnail, setThumbnail] = useState<{
    file: File;
    url: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;

    async function renderThumbnail() {
      const { getDocument, GlobalWorkerOptions } = await import("pdfjs-dist");
      const data = await file.arrayBuffer();
      if (cancelled) return;

      GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
      loadingTask = getDocument({ data: new Uint8Array(data) });

      try {
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        if (cancelled) return;

        const originalViewport = page.getViewport({ scale: 1 });
        const viewport = page.getViewport({
          scale:
            512 / Math.max(originalViewport.width, originalViewport.height),
        });
        const canvas = document.createElement("canvas");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({ canvas, viewport }).promise;
        if (!cancelled) {
          setThumbnail({ file, url: canvas.toDataURL("image/png") });
        }
      } finally {
        await loadingTask.destroy();
        loadingTask = undefined;
      }
    }

    // Unreadable or password-protected PDFs retain the document placeholder.
    void renderThumbnail().catch(() => {});

    return () => {
      cancelled = true;
      void loadingTask?.destroy().catch(() => {});
    };
  }, [file]);

  if (thumbnail?.file !== file) return null;

  return (
    <img
      src={thumbnail.url}
      alt=""
      className="absolute inset-0 size-full bg-white object-cover object-top"
    />
  );
}
