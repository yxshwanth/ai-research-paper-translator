"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "framer-motion";
import { FileText, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AnalysisResult } from "@/lib/types";
import { LoadingState } from "./LoadingState";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

interface FileUploadProps {
  onResult: (result: AnalysisResult) => void;
}

export function FileUpload({ onResult }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
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

    try {
      const formData = new FormData();
      formData.append("paper", file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Analysis failed.");
      }

      onResult(data as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setFile(null);
  };

  if (isUploading) {
    return <LoadingState />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-12 cursor-pointer transition-all duration-200
          ${isDragActive ? "border-[#1a2332] bg-[#f5f5f0]" : "border-[#c4b8a8] hover:border-[#1a2332]/60 hover:bg-[#fafaf7]"}
          bg-[#FAFAF7]
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4 text-center">
          <motion.div
            animate={{ scale: isDragActive ? 1.05 : 1 }}
            transition={{ duration: 0.2 }}
            className="rounded-full bg-[#1a2332]/5 p-4"
          >
            <FileText className="h-12 w-12 text-[#1a2332]" strokeWidth={1.5} />
          </motion.div>
          <div>
            <p className="font-heading text-xl text-[#1a2332] mb-1">
              {isDragActive ? "Drop your PDF here" : "Drag & drop your research paper"}
            </p>
            <p className="text-sm text-[#1a2332]/70">
              or click to browse · PDF only · max 10 MB
            </p>
          </div>
        </div>
      </div>

      {file && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white border border-[#e8e4dc] shadow-sm"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="h-8 w-8 text-[#1a2332] shrink-0" />
            <span className="text-[#1a2332] font-medium truncate">{file.name}</span>
          </div>
          <Button
            onClick={handleUpload}
            className="bg-[#1a2332] hover:bg-[#1a2332]/90 text-white shrink-0"
          >
            <Upload className="h-4 w-4 mr-2" />
            Analyze Paper
          </Button>
        </motion.div>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <p className="flex-1 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            Retry
          </Button>
        </motion.div>
      )}
    </div>
  );
}
