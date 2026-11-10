import { calculator } from "./calculator.js";
import { getCurrentTime } from "./time.js";
import { saveNote, searchNotes, listNotes } from "./notes.js";

// To add a new tool: create a file, export { definition, run }, add it here.
const tools = [calculator, getCurrentTime, saveNote, searchNotes, listNotes];

export const toolDefinitions = tools.map((t) => t.definition);

const registry = Object.fromEntries(tools.map((t) => [t.definition.name, t.run]));

export async function runTool(name, input) {
  const fn = registry[name];
  if (!fn) throw new Error(`Unknown tool: ${name}`);
  return fn(input);
}
