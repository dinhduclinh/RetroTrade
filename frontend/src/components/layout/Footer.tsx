import * as React from "react";
import { Container } from "./Container";

export function Footer() {
  return (
    <footer className="border-t border-foreground/10 mt-16">
      <Container className="py-8 text-sm text-foreground/70 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>© {new Date().getFullYear()} RetroTrade. All rights reserved.</div>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:underline">Privacy</a>
          <a href="#terms" className="hover:underline">Terms</a>
          <a href="#contact" className="hover:underline">Contact</a>
        </div>
      </Container>
    </footer>
  );
}

export default Footer;


