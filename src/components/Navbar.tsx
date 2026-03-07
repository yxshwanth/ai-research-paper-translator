"use client";

import Link from "next/link";
import { Github } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-[#e8e4dc] bg-[#FAFAF7]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="font-heading text-lg font-semibold text-[#1a2332] hover:text-[#1a2332]/80 transition-colors"
        >
          🧠 PaperTranslator
        </Link>
        <a
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-[#1a2332]/70 hover:text-[#1a2332] transition-colors"
          aria-label="GitHub"
        >
          <Github className="h-5 w-5" />
        </a>
      </div>
    </nav>
  );
}
