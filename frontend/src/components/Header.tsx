import { PanelLeft } from "lucide-react";

import avatar from "@/assets/prostefakty-avatar.svg";
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
    <header className="relative flex items-center justify-center px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-4 lg:gap-3 lg:px-5 lg:py-3">
      {onOpenDocuments && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Pokaż dokumenty"
          aria-expanded={documentsOpen}
          aria-controls="document-drawer"
          onClick={onOpenDocuments}
          className="absolute left-3 rounded-full lg:hidden"
        >
          <PanelLeft aria-hidden="true" className="size-6" />
        </Button>
      )}
      <img
        src={avatar}
        alt=""
        width={210}
        height={840}
        className="hidden h-11 w-auto lg:block"
      />
      <h1 className="font-logo text-[28px] leading-none font-normal text-primary sm:text-[32px] lg:text-[40px] lg:text-foreground">
        <span className="lg:hidden">ProsteFakty</span>
        <span className="hidden lg:inline">Proste Fakty</span>
      </h1>
    </header>
  );
}
