import { generateId } from "./uid";

export const JOURNAL_BLOCK_LIBRARY = [
  {
    type: "text",
    label: "Text box",
    defaultHeading: "Notes",
    placeholder: "Write your notes...",
  },
  {
    type: "todo",
    label: "To-do list",
    defaultHeading: "Checklist",
    placeholder: "Add checklist item",
  },
  {
    type: "numbered",
    label: "Numbered list",
    defaultHeading: "Numbered notes",
    placeholder: "Add numbered item",
  },
];

const LEGACY_SECTION_TITLES = {
  reflection: "Daily Reflection",
  gratitude: "Gratitude",
  wins: "Wins & Learnings",
  freeform: "Freeform",
};

export function createJournalBlock(type = "text", headingOverride = "") {
  const def = JOURNAL_BLOCK_LIBRARY.find((block) => block.type === type) || JOURNAL_BLOCK_LIBRARY[0];
  if (def.type === "text") {
    return {
      id: generateId(),
      type: "text",
      heading: headingOverride || def.defaultHeading,
      text: "",
    };
  }
  if (def.type === "todo") {
    return {
      id: generateId(),
      type: "todo",
      heading: headingOverride || def.defaultHeading,
      items: [{ id: generateId(), text: "", checked: false }],
    };
  }
  return {
    id: generateId(),
    type: "numbered",
    heading: headingOverride || def.defaultHeading,
    items: [{ id: generateId(), text: "" }],
  };
}

export function normalizeJournalBlocks(blocks, fallbackContent = "", legacySections = null) {
  if (Array.isArray(blocks) && blocks.length > 0) {
    return blocks.map((block) => {
      const normalized = {
        id: block?.id || generateId(),
        type: block?.type || "text",
        heading: String(block?.heading || ""),
      };
      if (normalized.type === "text") {
        normalized.text = String(block?.text || "");
        return normalized;
      }
      const items = Array.isArray(block?.items) ? block.items : [];
      if (normalized.type === "todo") {
        normalized.items = items.length
          ? items.map((item) => ({ id: item?.id || generateId(), text: String(item?.text || ""), checked: !!item?.checked }))
          : [{ id: generateId(), text: "", checked: false }];
        return normalized;
      }
      normalized.type = "numbered";
      normalized.items = items.length
        ? items.map((item) => ({ id: item?.id || generateId(), text: String(item?.text || "") }))
        : [{ id: generateId(), text: "" }];
      return normalized;
    });
  }

  if (legacySections && typeof legacySections === "object") {
    const sectionBlocks = Object.entries(legacySections)
      .filter(([, value]) => String(value || "").trim())
      .map(([sectionId, value]) => {
        const block = createJournalBlock("text", LEGACY_SECTION_TITLES[sectionId] || sectionId);
        block.text = String(value || "");
        return block;
      });
    if (sectionBlocks.length) return sectionBlocks;
  }

  const fallbackText = String(fallbackContent || "").trim();
  if (!fallbackText) return [createJournalBlock("text", "Notes")];
  const block = createJournalBlock("text", "Notes");
  block.text = fallbackText;
  return [block];
}

export function composeJournalContentFromBlocks(blocks) {
  const normalized = normalizeJournalBlocks(blocks);
  return normalized
    .map((block) => {
      const heading = String(block.heading || "Untitled").trim();
      if (block.type === "text") {
        const text = String(block.text || "").trim();
        if (!text) return null;
        return `${heading}:\n${text}`;
      }
      if (block.type === "todo") {
        const lines = (block.items || [])
          .map((item) => String(item.text || "").trim())
          .filter(Boolean)
          .map((text) => `- ${text}`);
        if (!lines.length) return null;
        return `${heading}:\n${lines.join("\n")}`;
      }
      const lines = (block.items || [])
        .map((item) => String(item.text || "").trim())
        .filter(Boolean)
        .map((text, index) => `${index + 1}. ${text}`);
      if (!lines.length) return null;
      return `${heading}:\n${lines.join("\n")}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

export function countFilledJournalBlocks(blocks) {
  const normalized = normalizeJournalBlocks(blocks);
  return normalized.reduce((count, block) => {
    if (block.type === "text") return count + (String(block.text || "").trim() ? 1 : 0);
    const hasItem = (block.items || []).some((item) => String(item.text || "").trim());
    return count + (hasItem ? 1 : 0);
  }, 0);
}

export function extractJournalBlockHeadings(blocks) {
  const normalized = normalizeJournalBlocks(blocks);
  return normalized
    .map((block) => String(block.heading || "").trim())
    .filter(Boolean);
}

export function createBlockStructureFromBlocks(blocks) {
  const normalized = normalizeJournalBlocks(blocks);
  return normalized.map((block) => ({
    type: block.type,
    heading: String(block.heading || "").trim() || "Untitled",
  }));
}

export function createBlocksFromStructure(structure) {
  if (!Array.isArray(structure) || !structure.length) return [createJournalBlock("text", "Notes")];
  return structure.map((item) => createJournalBlock(item?.type || "text", String(item?.heading || "").trim()));
}
