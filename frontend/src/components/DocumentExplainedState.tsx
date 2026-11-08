import { ArrowUp } from "lucide-react";

import { DocumentAttachmentPreview } from "@/components/DocumentAttachmentPreview";
import { DocumentCard } from "@/components/DocumentCard";
import { Button } from "@/components/ui/button";

const sampleExplanations = [
  {
    summary:
      "Urząd prosi o uzupełnienie wniosku. Brakuje podpisanego formularza i potwierdzenia opłaty.",
    detail: "Dokumenty trzeba dostarczyć do 20 listopada.",
  },
  {
    summary: "To lista załączników, które trzeba dołączyć do wniosku.",
    detail: "Sprawdź, czy masz podpisany formularz i potwierdzenie opłaty.",
  },
];

export function DocumentExplainedState({ documents }: { documents: File[] }) {
  return (
    <section
      aria-labelledby="document-explanations-title"
      className="@container flex min-h-0 min-w-0 flex-1 flex-col p-[16px] sm:p-[24px] lg:p-[32px]"
    >
      <h2 id="document-explanations-title" className="sr-only">
        Wyjaśnienia dokumentów
      </h2>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <p className="mb-[20px] hidden text-[12px] text-muted-foreground lg:block">
          Przykładowe wyjaśnienia
        </p>
        <div className="space-y-8 lg:space-y-[52px]">
          {documents.map((file, index) => {
            const explanation =
              sampleExplanations[index % sampleExplanations.length];

            return (
              <article
                key={index}
                className="grid grid-cols-[100px_minmax(0,1fr)] items-start gap-x-3 gap-y-4 lg:grid-cols-1 lg:gap-x-[24px] lg:gap-y-[20px] lg:@[360px]:grid-cols-[100px_minmax(0,1fr)] lg:@[500px]:grid-cols-[122px_minmax(0,1fr)]"
              >
                <div className="lg:hidden">
                  <DocumentCard
                    file={file}
                    number={index + 1}
                    variant="sheet"
                    compact
                  />
                </div>
                <div className="hidden w-[100px] lg:block lg:@[500px]:w-[122px]">
                  <DocumentAttachmentPreview file={file} number={index + 1} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-[18px] leading-snug wrap-anywhere @[500px]:text-[20px]">
                    {file.name}
                  </h3>
                  <p className="mt-[12px] text-[16px] leading-[26px] @[500px]:text-[18px]">
                    {explanation.summary}
                  </p>
                </div>
                <p className="col-span-2 text-[16px] leading-[26px] lg:col-span-1 lg:@[360px]:col-span-2 lg:@[500px]:text-[18px]">
                  {explanation.detail}
                </p>
              </article>
            );
          })}
        </div>
      </div>
      <div className="shrink-0 pt-[24px]">
        <div className="flex min-w-0 items-center gap-[12px] rounded-full bg-muted p-[12px] focus-within:ring-2 focus-within:ring-ring/40">
          <input
            type="text"
            aria-label="Zapytaj o dokumenty"
            placeholder="Zapytaj o dokumenty..."
            className="min-w-0 flex-1 bg-transparent pl-[10px] text-[14px] outline-none placeholder:text-muted-foreground sm:text-[16px]"
          />
          <Button
            type="button"
            aria-label="Wyślij pytanie"
            size="icon"
            className="size-[40px] rounded-full"
          >
            <ArrowUp aria-hidden="true" className="size-[24px]" />
          </Button>
        </div>
      </div>
    </section>
  );
}
