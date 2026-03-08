"use client";

import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Brain, Github, LogIn, LogOut, User, FileText } from "lucide-react";

export function Navbar() {
  const { user, isLoading } = useUser();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-3">
          <Brain className="h-8 w-8 text-accent" />
          <h1 className="font-heading text-2xl text-foreground">PaperLens</h1>
        </Link>

        <div className="flex items-center gap-2">
          {!isLoading && user && (
            <>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">My Papers</span>
              </Link>
              <span className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline max-w-[120px] truncate">
                  {user.name ?? user.email ?? "User"}
                </span>
              </span>
              <a
                href="/auth/logout"
                className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-muted"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </a>
            </>
          )}
          {!isLoading && !user && (
            <a
              href="/auth/login"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm transition-colors hover:bg-muted"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Log in</span>
            </a>
          )}
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
      </div>
    </nav>
  );
}
