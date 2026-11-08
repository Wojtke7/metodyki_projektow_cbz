import { Upload } from "lucide-react"
import { useState } from "react"

import { Header } from "@/components/Header"
import { MainNav, type MainSection } from "@/components/MainNav"
import { Button } from "@/components/ui/button"

export function Main() {
  const [activeSection, setActiveSection] = useState<MainSection>("documents")

  return (
    <div className="flex min-h-svh flex-col">
      <Header />
      <main className="grid flex-1 grid-cols-[72px_minmax(0,1440px)_72px] justify-center gap-3 px-3 pb-6 sm:grid-cols-[88px_minmax(0,1440px)_88px] sm:gap-6 sm:px-4">
        <MainNav
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
        <section
          id="main-content"
          aria-labelledby="main-content-title"
          className="flex min-h-[480px] min-w-0 items-center justify-center rounded-[24px] border bg-card px-4 py-10 text-card-foreground"
        >
          {activeSection === "documents" ? (
            <div className="flex flex-col items-center gap-6 text-center">
              <Upload aria-hidden="true" className="size-9 text-primary" />
              <h2 id="main-content-title" className="text-lg sm:text-[22px]">
                Przeciągnij dokumenty tutaj
              </h2>
              <Button
                type="button"
                className="h-12 w-full max-w-[208px] rounded-xl text-base font-bold"
              >
                Wybierz pliki
              </Button>
            </div>
          ) : (
            <h2 id="main-content-title" className="text-lg sm:text-[22px]">
              {activeSection === "section-2" ? "Sekcja 2" : "Sekcja 3"}
            </h2>
          )}
        </section>
      </main>
    </div>
  )
}
