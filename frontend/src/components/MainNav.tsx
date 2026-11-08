import { FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const sections = [
  {
    id: "documents",
    label: "Dokumenty",
    marker: <FileText className="size-6" />
  },
  { id: "section-2", label: "Sekcja 2", marker: "2" },
  { id: "section-3", label: "Sekcja 3", marker: "3" }
] as const

export type MainSection = (typeof sections)[number]["id"]

type MainNavProps = {
  activeSection: MainSection
  onSectionChange: (section: MainSection) => void
}

export function MainNav({ activeSection, onSectionChange }: MainNavProps) {
  return (
    <nav
      aria-label="Nawigacja główna"
      className="flex w-[72px] shrink-0 flex-col gap-2 self-center rounded-full border bg-card p-[7px] sm:w-[88px]"
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
            "h-[86px] w-full flex-col gap-2 rounded-full px-0 py-3 text-[9px] text-muted-foreground sm:text-[10px]",
            activeSection === section.id &&
              "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-6 items-center text-lg font-bold"
          >
            {section.marker}
          </span>
          <span>{section.label}</span>
        </Button>
      ))}
    </nav>
  )
}
