"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import type { AnalysisResult, UserLevel } from "@/lib/types";
import { SteppedProgress } from "./SteppedProgress";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface FileUploadProps {
  onResult: (result: AnalysisResult) => void;
}

const LEVELS: { value: UserLevel; label: string }[] = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "expert", label: "Expert" },
];

export function FileUpload({ onResult }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [level, setLevel] = useState<UserLevel>("intermediate");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{
    phase: "extracting" | "analyzing" | "finalizing";
    extractingDone: boolean;
    analyzingDone: boolean;
  }>({
    phase: "extracting",
    extractingDone: false,
    analyzingDone: false,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    maxSize: MAX_SIZE,
    maxFiles: 1,
    disabled: isUploading,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection?.errors[0]?.code === "file-too-large") {
        setError("File is too large. Maximum size is 10 MB.");
      } else if (rejection?.errors[0]?.code === "file-invalid-type") {
        setError("Invalid file type. Only PDF files are accepted.");
      } else {
        setError("File could not be accepted. Please try again.");
      }
    },
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setProgress({ phase: "extracting", extractingDone: false, analyzingDone: false });

    const formData = new FormData();
    formData.append("paper", file);
    formData.append("level", level);

    try {
      const response = await fetch("/api/analyze/stream", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Analysis failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        let event: string | null = null;
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            event = line.slice(7).trim();
          } else if (line.startsWith("data: ") && event) {
            try {
              const data = JSON.parse(line.slice(6));
              if (event === "progress") {
                setProgress((p) => ({
                  phase: data.phase ?? p.phase,
                  extractingDone: data.phase === "extracting" && data.done ? true : p.extractingDone,
                  analyzingDone: data.phase === "analyzing" && data.done ? true : p.analyzingDone,
                }));
              } else if (event === "done") {
                onResult(data as AnalysisResult);
                setIsUploading(false);
                return;
              } else if (event === "error") {
                throw new Error(data.error ?? "Analysis failed.");
              }
            } catch (e) {
              if (e instanceof SyntaxError) continue;
              throw e;
            }
            event = null;
          }
        }
      }
      setError("Analysis ended without result.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  if (isUploading) {
    return (
      <SteppedProgress
        currentPhase={progress.phase}
        extractingDone={progress.extractingDone}
        analyzingDone={progress.analyzingDone}
      />
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div
            {...getRootProps()}
            className={`
              relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all
              ${isDragActive ? "border-accent bg-accent/5 scale-[1.02]" : "border-border hover:border-accent/50 hover:bg-muted/30"}
            `}
          >
            <input {...getInputProps()} />
            <motion.div
            animate={isDragActive ? { scale: 1.1 } : { scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Upload className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          </motion.div>
          <h3 className="text-2xl mb-2 text-foreground font-heading">
            {isDragActive ? "Drop your paper here" : "Upload Research Paper"}
          </h3>
          <p className="text-muted-foreground mb-4">
            Drag and drop a PDF file here, or click to browse
          </p>
          <p className="text-sm text-muted-foreground">
            Maximum file size: 10 MB • Only PDF files accepted
          </p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-accent" />
              <div>
                <p className="font-medium text-foreground">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={removeFile}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Remove file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-foreground">Level</p>
            <div className="flex flex-wrap gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => setLevel(l.value)}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition-colors ${
                    level === l.value
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border bg-card text-foreground hover:border-accent/50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Affects depth of explanations and quiz difficulty
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4"
            >
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-destructive">{error}</p>
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm underline underline-offset-2 hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleUpload}
            className="w-full rounded-xl bg-primary px-8 py-4 text-lg text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Analyze Paper
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
