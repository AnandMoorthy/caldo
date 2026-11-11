export const JOURNAL_TEMPLATES = [
  {
    id: "reflection",
    name: "Daily Reflection",
    description: "Reflect on what happened and how it felt.",
    defaultTitle: "Daily Reflection",
    prompt: `Highlights from today:
- 

Challenges I faced:
- 

What I learned:
- 

What I want to improve tomorrow:
- `,
  },
  {
    id: "gratitude",
    name: "Gratitude",
    description: "Capture the moments and people you are thankful for.",
    defaultTitle: "Gratitude Journal",
    prompt: `Three things I am grateful for:
1. 
2. 
3. 

Why they mattered:
- `,
  },
  {
    id: "wins",
    name: "Wins & Learnings",
    description: "Track progress with small wins and meaningful learnings.",
    defaultTitle: "Wins & Learnings",
    prompt: `Today's wins:
- 

Today's learnings:
- 

Next small step:
- `,
  },
  {
    id: "freeform",
    name: "Freeform",
    description: "A blank page to write freely.",
    defaultTitle: "Journal Entry",
    prompt: "",
  },
];

export function getJournalTemplateById(templateId) {
  return JOURNAL_TEMPLATES.find((template) => template.id === templateId) || JOURNAL_TEMPLATES[0];
}
