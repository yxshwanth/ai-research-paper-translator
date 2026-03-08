// Import from lib directly to avoid index.js test block that runs on load
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");

const MAX_CHARS = 30_000;

/** Check for garbled characters and fragmented lines. Returns warning message if parse quality is poor. */
export function checkPdfParseQuality(text: string): string | undefined {
  if (!text || text.length < 200) return undefined;

  // Garbled: replacement char (U+FFFD), question marks (common PDF artifact), or high ratio of non-word chars
  const replacementCount = (text.match(/\uFFFD/g) ?? []).length;
  const garbledRatio = replacementCount / text.length;

  // Also: lines that are mostly symbols (equations/tables often become symbol soup)
  const lines = text.split(/\n/).filter((l) => l.trim().length > 0);
  const shortLines = lines.filter((l) => l.trim().length <= 3);
  const shortLineRatio = shortLines.length / Math.max(1, lines.length);

  if (garbledRatio > 0.02) {
    return "The PDF may not have parsed cleanly — many characters appear garbled. Equations, tables, or special symbols might be missing or incorrect. Consider verifying key details against the original.";
  }
  if (shortLineRatio > 0.25) {
    return "The extracted text has many very short fragmented lines. Tables and equations may be mangled. Analysis quality could be affected.";
  }
  return undefined;
}

export async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer);
    const rawText = data.text ?? "";

    if (!rawText || rawText.trim().length === 0) {
      throw new Error(
        "The PDF appears to have no extractable text. It may be image-based and would require OCR."
      );
    }

    const cleaned = rawText
      .replace(/\s+/g, " ")
      .replace(/\n\s*\n/g, "\n")
      .trim();

    if (cleaned.length < 100) {
      throw new Error(
        "The PDF has too little readable text. It may be scanned or image-based."
      );
    }

    return cleaned.length > MAX_CHARS ? cleaned.slice(0, MAX_CHARS) : cleaned;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
    throw new Error("PDF parsing failed due to an unknown error.");
  }
}
