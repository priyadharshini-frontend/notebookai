import { GoogleGenAI } from "@google/genai";
import { config } from "../config.js";
import { toolDefinitions, runTool } from "./tools/index.js";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_PROMPT = `You are a helpful personal assistant.
- Use tools when they help. Never guess arithmetic; use the calculator.
- When the user asks you to remember something, save it with save_note.
- Before saying you don't know something the user may have told you, search their notes.
- Keep answers short and clear.`;

// Convert our tool definitions into Gemini's format
const geminiTools = [
  {
    functionDeclarations: toolDefinitions.map((t) => ({
      name: t.name,
      description: t.description,
      parametersJsonSchema: t.input_schema,
    })),
  },
];

/**
 * THE AGENT LOOP (same idea as before, Gemini message format)
 * 1. Send history + tools to the model
 * 2. If the model asks for functions -> run them, add results, go to 1
 * 3. If the model gives a final answer -> stop
 *
 * Gemini roles are "user" and "model". Messages look like:
 *   { role: "user",  parts: [{ text: "hi" }] }
 *   { role: "model", parts: [{ functionCall: { name, args } }] }
 *   { role: "user",  parts: [{ functionResponse: { name, response } }] }
 */
export async function runAgent(history) {
  const messages = [...history];
  const trace = [];

  async function generateWithRetry(params, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (err) {
      const retryable =
        [429, 500, 503].includes(err.status) || /UNAVAILABLE|high demand/i.test(err.message);
      if (!retryable || i === retries) throw err;
      const wait = 1000 * 2 ** i; // 1s, 2s, 4s
      console.log(`Gemini busy, retrying in ${wait / 1000}s...`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}

  for (let step = 0; step < config.maxSteps; step++) {
    const response = await generateWithRetry({
      model: config.model,
      contents: messages,
      config: { systemInstruction: SYSTEM_PROMPT, tools: geminiTools },
    });
    






    // Keep the model's full turn in history (it can contain signatures Gemini needs back)
    const modelContent = response.candidates[0].content;
    messages.push(modelContent);

    const calls = response.functionCalls;

    // No function requested -> final answer
    if (!calls || calls.length === 0) {
      return { text: response.text || "", messages, trace };
    }

    // Run every function the model asked for
    const responseParts = [];
    for (const call of calls) {
      let output;
      let isError = false;
      try {
        output = await runTool(call.name, call.args || {});
      } catch (err) {
        output = `Error: ${err.message}`; // the model can read this and recover
        isError = true;
      }
      console.log(`[tool] ${call.name}`, call.args, "->", output);
      trace.push({ tool: call.name, input: call.args, output: String(output), isError });

      responseParts.push({
        functionResponse: {
          name: call.name,
          response: isError ? { error: String(output) } : { output: String(output) },
        },
      });
    }

    // Function results go back as a "user" message, then we loop again
    messages.push({ role: "user", parts: responseParts });
  }

  const text = "I hit my step limit before finishing. Try a simpler request.";
  messages.push({ role: "model", parts: [{ text }] });
  return { text, messages, trace };
}
