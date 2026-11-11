export const JOURNAL_SECTIONS = [
  {
    id: "reflection",
    title: "Daily Reflection",
    description: "Reflect on what happened and how it felt.",
    placeholder: "Highlights, challenges, learnings, and what to improve tomorrow...",
  },
  {
    id: "gratitude",
    title: "Gratitude",
    description: "Capture moments or people you are thankful for.",
    placeholder: "Three things you're grateful for and why they mattered...",
  },
  {
    id: "wins",
    title: "Wins & Learnings",
    description: "Track progress with wins, lessons, and next steps.",
    placeholder: "Today's wins, what you learned, and your next small step...",
  },
  {
    id: "freeform",
    title: "Freeform",
    description: "Write anything else you want to remember.",
    placeholder: "Write your journal entry...",
  },
];

export function createEmptyJournalSections() {
  return JOURNAL_SECTIONS.reduce((acc, section) => {
    acc[section.id] = "";
    return acc;
  }, {});
}

export function normalizeJournalSections(sections, fallbackContent = "") {
  const normalized = createEmptyJournalSections();
  if (sections && typeof sections === "object") {
    Object.keys(normalized).forEach((key) => {
      normalized[key] = String(sections[key] || "");
    });
    return normalized;
  }
  normalized.freeform = String(fallbackContent || "");
  return normalized;
}

export function composeJournalContentFromSections(sections) {
  const normalized = normalizeJournalSections(sections);
  return JOURNAL_SECTIONS.map((section) => {
    const value = String(normalized[section.id] || "").trim();
    if (!value) return null;
    return `${section.title}:\n${value}`;
  })
    .filter(Boolean)
    .join("\n\n");
}

export function countFilledJournalSections(sections) {
  const normalized = normalizeJournalSections(sections);
  return JOURNAL_SECTIONS.reduce((count, section) => {
    return count + (String(normalized[section.id] || "").trim() ? 1 : 0);
  }, 0);
}
