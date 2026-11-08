import { ChevronsRight, FileText } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

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

const mainNavWidth = {
  collapsed: "4.5rem",
  expanded: "13rem",
} as const;

const navEase = [0.22, 1, 0.36, 1] as const;

type MainNavProps = {
  activeSection: MainSection;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  onSectionChange: (section: MainSection) => void;
};

export function MainNav({
  activeSection,
  expanded,
  onExpandedChange,
  onSectionChange,
}: MainNavProps) {
  const reducedMotion = useReducedMotion();
  const navTransition = reducedMotion
    ? { duration: 0 }
    : { duration: 0.34, ease: navEase };
  const labelTransition = reducedMotion
    ? { duration: 0 }
    : expanded
      ? { duration: 0.2, delay: 0.12, ease: "easeOut" as const }
      : { duration: 0.12, ease: "easeIn" as const };

  return (
    <motion.nav
      initial={false}
      animate={{
        "--nav-width": expanded
          ? mainNavWidth.expanded
          : mainNavWidth.collapsed,
      }}
      transition={navTransition}
      id="main-nav"
      aria-label="Nawigacja główna"
      className="glass-surface order-last mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] flex shrink-0 flex-row gap-1 rounded-[28px] p-1.5 sm:mx-5 lg:order-none lg:mx-0 lg:mb-0 lg:w-[calc(var(--nav-width)+4px)] lg:min-w-0 lg:flex-col lg:gap-2 lg:self-center lg:p-2"
    >
      {sections.map((section) => (
        <Button
          key={section.id}
          type="button"
          variant={activeSection === section.id ? "default" : "ghost"}
          aria-current={activeSection === section.id ? "page" : undefined}
          aria-controls="main-content"
          onClick={() => onSectionChange(section.id)}
          className={cn(
            "h-14 min-w-0 flex-1 flex-col gap-1 rounded-[22px] px-1 py-2 text-[11px] lg:h-14 lg:w-full lg:min-w-0 lg:flex-none lg:flex-row lg:justify-start lg:gap-0 lg:overflow-hidden lg:px-0 lg:py-0",
            activeSection !== section.id && "text-muted-foreground",
          )}
        >
          <span
            aria-hidden="true"
            className="flex h-5 shrink-0 items-center text-base font-bold lg:grid lg:size-14 lg:place-items-center lg:text-lg"
          >
            {section.marker}
          </span>
          <span className="lg:hidden">{section.label}</span>
          <motion.span
            initial={false}
            animate={{ opacity: expanded ? 1 : 0, x: expanded ? 0 : -8 }}
            transition={labelTransition}
            className="hidden min-w-0 flex-1 truncate pr-4 text-left text-base lg:block"
          >
            {section.label}
          </motion.span>
        </Button>
      ))}
      <div className="ml-px hidden size-14 shrink-0 place-items-center lg:grid">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-expanded={expanded}
          aria-controls="main-nav"
          aria-label={expanded ? "Zwiń nawigację" : "Rozwiń nawigację"}
          title={expanded ? "Zwiń nawigację" : "Rozwiń nawigację"}
          onClick={() => onExpandedChange(!expanded)}
          className="size-[44px] rounded-2xl"
        >
          <motion.span
            initial={false}
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={navTransition}
            className="grid place-items-center"
          >
            <ChevronsRight aria-hidden="true" className="size-5" />
          </motion.span>
        </Button>
      </div>
    </motion.nav>
  );
}
