// Import from lib directly to avoid index.js test block that runs on load
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require("pdf-parse/lib/pdf-parse.js");

const MAX_CHARS = 30_000;

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
