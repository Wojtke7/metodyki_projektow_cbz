import avatar from "@/assets/prostefakty-avatar.svg"

export function Header() {
  return (
    <header className="flex items-center justify-center gap-3 px-5 py-3">
      <img
        src={avatar}
        alt=""
        width={210}
        height={840}
        className="h-11 w-auto"
      />
      <h1 className="font-logo text-[40px] font-normal">Proste Fakty</h1>
    </header>
  )
}
