"use client";

import Link from "next/link";
import { Brain, Github } from "lucide-react";

export function Navbar() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-accent" />
          <h1 className="font-heading text-2xl text-foreground">PaperTranslator</h1>
        </Link>

        <a
          href="https://github.com/yxshwanth/ai-research-paper-translator"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-muted"
        >
          <Github className="h-5 w-5" />
          <span className="hidden sm:inline">GitHub</span>
        </a>
      </div>
    </nav>
  );
}
