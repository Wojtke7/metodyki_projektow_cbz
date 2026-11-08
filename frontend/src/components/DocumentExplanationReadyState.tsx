import {
  CalendarDays,
  FileText,
  ListChecks,
  MessagesSquare,
} from "lucide-react";

const explanationDetails = [
  {
    icon: FileText,
    title: "Proste wyjaśnienie",
    description: "Najważniejsze informacje z dokumentów.",
  },
  {
    icon: ListChecks,
    title: "Kolejne kroki",
    description: "Co trzeba zrobić dalej.",
  },
  {
    icon: CalendarDays,
    title: "Ważne terminy",
    description: "Na co zwrócić uwagę.",
  },
];

export function DocumentExplanationReadyState() {
  return (
    <section
      aria-labelledby="document-explanation-title"
      className="flex shrink-0 flex-col items-center border-t px-[16px] py-[32px] sm:px-[24px] lg:min-w-0 lg:flex-1 lg:overflow-y-auto lg:border-t-0 lg:p-[32px]"
    >
      <div className="my-auto w-full max-w-[400px] shrink-0 text-center">
        <MessagesSquare
          aria-hidden="true"
          className="mx-auto mb-[20px] size-[40px] text-primary"
        />
        <h2
          id="document-explanation-title"
          className="text-[20px] leading-snug sm:text-[24px]"
        >
          Dokumenty gotowe do wyjaśnienia
        </h2>
        <p className="mt-[12px] text-[14px] leading-relaxed text-muted-foreground sm:text-[16px]">
          Kliknij „Wyjaśnij dokumenty”, aby dowiedzieć się, co oznaczają
          przesłane pisma.
        </p>
        <ul className="mt-[32px] flex flex-col gap-[20px] text-left">
          {explanationDetails.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex items-start gap-[12px]">
              <Icon
                aria-hidden="true"
                className="mt-[2px] size-[20px] shrink-0 text-primary"
              />
              <div className="min-w-0">
                <h3 className="text-[14px] leading-[22px]">{title}</h3>
                <p className="mt-[2px] text-[14px] leading-[22px] text-muted-foreground">
                  {description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
