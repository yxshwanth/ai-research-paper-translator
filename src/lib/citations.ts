import type { CitationFields } from "./types";

/** Format structured citation fields to APA 7th edition. */
export function formatAPA(fields: CitationFields): string {
  const { authors, title, year, journal, volume, pages, doi } = fields;
  const authorStr =
    authors.length === 0
      ? "Unknown"
      : authors.length === 1
        ? authors[0]
        : authors.length <= 7
          ? authors
              .map((a, i) =>
                i < authors.length - 1 ? `${a}, ` : `& ${a}`
              )
              .join("")
          : `${authors[0]}, ${authors[1]}, ${authors[2]}, ... ${authors[authors.length - 1]}`;

  let out = `${authorStr} (${year ?? "n.d."}). ${title}.`;
  if (journal) {
    out += ` ${journal}`;
    if (volume) out += `, ${volume}`;
    if (pages) out += `, ${pages}`;
    out += ".";
  }
  if (doi) out += ` https://doi.org/${doi.replace(/^https?:\/\/doi\.org\//i, "")}`;
  return out;
}

/** Format structured citation fields to MLA 9th edition. */
export function formatMLA(fields: CitationFields): string {
  const { authors, title, year, journal, volume, pages } = fields;
  const authorStr =
    authors.length === 0
      ? "Unknown"
      : authors.length === 1
        ? authors[0]
        : authors
            .map((a, i) =>
              i < authors.length - 1 ? `${a}, ` : `and ${a}`
            )
            .join("");

  let out = `${authorStr}. "${title}"`;
  if (journal) {
    out += `. ${journal}`;
    if (volume) out += `, vol. ${volume}`;
    if (pages) out += `, pp. ${pages}`;
    out += ",";
  }
  out += ` ${year ?? "n.d."}.`;
  return out;
}
