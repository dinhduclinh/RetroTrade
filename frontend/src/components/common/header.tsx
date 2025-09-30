export default function Header() {
  return (
    <header
      className="fixed inset-x-0 top-0 z-50 border-b border-foreground/10 backdrop-blur bg-gradient-to-r from-foreground/10 to-transparent"
    >
      <div className="mx-auto max-w-6xl px-6 h-14 flex items-center justify-between">
        <strong className="text-base">RetroTrade</strong>
        <nav className="hidden sm:flex items-center gap-4 text-sm text-foreground/80">
          <a href="#start" className="hover:text-foreground">Quy trình</a>
          <a href="#features" className="hover:text-foreground">Tính năng</a>
        </nav>
      </div>
    </header>
  );
}