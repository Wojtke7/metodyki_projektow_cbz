import { PanelLeft } from "lucide-react";

import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

type HeaderProps = {
  documentsOpen?: boolean;
  onOpenDocuments?: () => void;
};

export function Header({
  documentsOpen = false,
  onOpenDocuments,
}: HeaderProps) {
  return (
    <header className="shrink-0 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 sm:px-5 lg:pt-6 lg:pr-8 lg:pb-6 lg:pl-[calc(3.5rem+88px)]">
      <div className=" flex min-h-16 items-center justify-between gap-2 rounded-[24px] px-[12px] py-2.5 sm:px-6 lg:min-h-[80px]">
        <div className="flex min-w-0 items-center gap-2">
          {onOpenDocuments && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Pokaż dokumenty"
              aria-expanded={documentsOpen}
              aria-controls="document-drawer"
              onClick={onOpenDocuments}
              className="size-[44px] rounded-2xl lg:hidden"
            >
              <PanelLeft aria-hidden="true" className="size-5" />
            </Button>
          )}
          <h1 className="font-logo text-[28px] leading-none font-normal tracking-tight text-foreground sm:text-[34px] lg:text-[40px]">
            ProsteFakty
          </h1>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
