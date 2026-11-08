import { FileText } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sections = [
  {
    id: "documents",
    label: "Dokumenty",
    marker: <FileText className="size-5 lg:size-6" />,
  },
  { id: "section-2", label: "Sekcja 2", marker: "2" },
  { id: "section-3", label: "Sekcja 3", marker: "3" },
] as const;

export type MainSection = (typeof sections)[number]["id"];

type MainNavProps = {
  activeSection: MainSection;
  onSectionChange: (section: MainSection) => void;
};

export function MainNav({ activeSection, onSectionChange }: MainNavProps) {
  return (
    <nav
      aria-label="Nawigacja główna"
      className="order-last mx-3 flex shrink-0 flex-row gap-1 rounded-full border bg-card p-1.5 lg:order-none lg:mx-0 lg:w-[88px] lg:flex-col lg:gap-2 lg:self-center lg:p-[7px]"
    >
      {sections.map((section) => (
        <Button
          key={section.id}
          type="button"
          variant="ghost"
          aria-current={activeSection === section.id ? "page" : undefined}
          aria-controls="main-content"
          onClick={() => onSectionChange(section.id)}
          className={cn(
            "h-16 min-w-0 flex-1 flex-col gap-1 rounded-full px-1 py-2 text-[11px] text-muted-foreground lg:h-[86px] lg:w-full lg:flex-none lg:gap-2 lg:px-0 lg:py-3 lg:text-[10px]",
            activeSection === section.id &&
              "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground",
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-5 items-center text-base font-bold lg:h-6 lg:text-lg"
          >
            {section.marker}
          </span>
          <span>{section.label}</span>
        </Button>
      ))}
    </nav>
  );
}
