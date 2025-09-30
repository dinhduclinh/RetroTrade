import * as React from "react";
import { Container } from "./Container";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-b border-foreground/10 backdrop-blur bg-background/70">
      <Container className="h-14 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-foreground text-background text-sm font-bold">R</span>
          <span className="font-semibold">RetroTrade</span>
        </div>
        <nav className="hidden sm:flex items-center gap-4 text-sm">
          <a href="#start" className="hover:underline">Bắt đầu</a>
          <a href="#features" className="hover:underline">Tính năng</a>
          <a href="#gallery" className="hover:underline">Bộ sưu tập</a>
          <a href="#showcase" className="hover:underline">Trưng bày 3D</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="outline" as="a" href="#login">Đăng nhập</Button>
          <Button as="a" href="#start">Đăng tin</Button>
        </div>
      </Container>
    </header>
  );
}

export default Navbar;


