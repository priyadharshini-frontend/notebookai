import { Note } from "../../models/Note.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const saveNote = {
  definition: {
    name: "save_note",
    description: "Save a note for the user so it can be found later. Use when the user says 'remember', 'save', or 'note'.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "The note content" },
        tags: { type: "array", items: { type: "string" }, description: "Optional short tags" },
      },
      required: ["text"],
    },
  },
  async run({ text, tags = [] }) {
    const note = await Note.create({ text, tags });
    return `Saved note with id ${note._id}`;
  },
};

export const searchNotes = {
  definition: {
    name: "search_notes",
    description: "Search the user's saved notes by keyword. Returns up to 5 matches, or 'No notes found.' if nothing matches.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "A keyword or short phrase to look for" },
      },
      required: ["query"],
    },
  },
  async run({ query }) {
    const rx = new RegExp(escapeRegex(query), "i");
    const notes = await Note.find({ $or: [{ text: rx }, { tags: rx }] })
      .sort({ createdAt: -1 })
      .limit(5);
    if (notes.length === 0) return "No notes found.";
    return notes.map((n) => `- (${n.createdAt.toISOString().slice(0, 10)}) ${n.text}`).join("\n");
  },
};

export const listNotes = {
  definition: {
    name: "list_recent_notes",
    description: "List the 10 most recent notes.",
    input_schema: { type: "object", properties: {} },
  },
  async run() {
    const notes = await Note.find().sort({ createdAt: -1 }).limit(10);
    if (notes.length === 0) return "No notes yet.";
    return notes.map((n) => `- ${n.text}`).join("\n");
  },
};
