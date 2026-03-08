"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Bot, AlertCircle } from "lucide-react";

interface Message {
  role: "user" | "model";
  content: string;
}

interface AskSectionProps {
  slug: string | undefined;
  suggestedQuestions?: string[];
  /** One sentence for context above chips, e.g. "This paper uses X to study Y." */
  topicOrMethodLine?: string;
}

export function AskSection({ slug, suggestedQuestions, topicOrMethodLine }: AskSectionProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestedFollowUp, setSuggestedFollowUp] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((m) => [...m, { role: "user", content: userMessage }]);
    setLoading(true);
    setError(null);

    const history = messages.map((msg) => ({
      role: msg.role as "user" | "model",
      content: msg.content,
    }));

    try {
      const res = await fetch("/api/paper/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          slug,
          question: userMessage,
          history,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        setMessages((m) => m.slice(0, -1));
        return;
      }
      setMessages((m) => [
        ...m,
        { role: "model", content: data.answer ?? "" },
      ]);
      if (data.suggestedFollowUp && typeof data.suggestedFollowUp === "string" && data.suggestedFollowUp.trim()) {
        setSuggestedFollowUp(data.suggestedFollowUp.trim());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send question.");
      setMessages((m) => m.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  if (!slug) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        <p>Save or share this analysis to ask follow-up questions about the paper.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col rounded-2xl border border-border bg-card overflow-hidden">
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto min-h-[280px] max-h-[420px] p-4 space-y-4"
      >
        {messages.length === 0 && (
          <div className="py-8 space-y-4">
            <p className="text-center text-muted-foreground">
              {topicOrMethodLine
                ? `${topicOrMethodLine} Here are good starting points:`
                : "Ask anything about this paper"}
            </p>
            {suggestedQuestions && suggestedQuestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setInput(q)}
                    className="rounded-full border border-border bg-muted/50 px-4 py-2 text-sm text-foreground hover:bg-muted hover:border-accent/50 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        {messages.length >= 2 && suggestedFollowUp && (
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <span className="text-xs text-muted-foreground w-full text-center">Suggested follow-up:</span>
            <button
              type="button"
              onClick={() => {
                setInput(suggestedFollowUp);
                setSuggestedFollowUp(null);
              }}
              className="rounded-full border border-accent/50 bg-accent/10 px-4 py-2 text-sm text-foreground hover:bg-accent/20 transition-colors"
            >
              {suggestedFollowUp}
            </button>
          </div>
        )}
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "model" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
                <Bot className="h-4 w-4" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary">
                <User className="h-4 w-4" />
              </div>
            )}
          </motion.div>
        ))}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent">
              <Bot className="h-4 w-4" />
            </div>
            <div className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
              Thinking...
            </div>
          </motion.div>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 bg-destructive/10 text-destructive text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="ml-auto underline"
          >
            Dismiss
          </button>
        </div>
      )}
      <form onSubmit={handleSubmit} className="border-t border-border p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask about this paper..."
            className="flex-1 rounded-xl border-2 border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-70"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-xl bg-primary px-4 py-3 text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            aria-label="Send"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
