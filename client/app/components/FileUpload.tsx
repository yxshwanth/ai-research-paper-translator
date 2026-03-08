import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { motion } from "motion/react";
import { Upload, FileText, X, AlertCircle } from "lucide-react";
import { AnalysisResult } from "../lib/types";
import { getMockAnalysisResult } from "../lib/mockData";

interface FileUploadProps {
  onResult: (result: AnalysisResult) => void;
}

export function FileUpload({ onResult }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate API call with mock data
      // TODO: Replace with actual API call to Google Gemini
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const mockResult = getMockAnalysisResult();
      onResult(mockResult);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to analyze the paper. Please try again."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const removeFile = () => {
    setFile(null);
    setError(null);
  };

  if (isProcessing) {
    return null; // Loading state will be shown by parent
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {!file ? (
        <motion.div
          {...getRootProps()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`
            relative cursor-pointer rounded-2xl border-2 border-dashed p-12 text-center transition-all
            ${
              isDragActive
                ? "border-accent bg-accent/5 scale-[1.02]"
                : "border-border hover:border-accent/50 hover:bg-muted/30"
            }
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
            >
              <X className="h-5 w-5" />
            </button>
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