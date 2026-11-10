import { Router } from "express";
import { Conversation } from "../models/Conversation.js";
import { runAgent } from "../agent/agent.js";
import { config } from "../config.js";

const router = Router();

// A "plain" user message has text. Function results are user messages too,
// but have no text, and must never be the first message sent.
const isPlainUserMessage = (m) =>
  m.role === "user" && m.parts?.some((p) => typeof p.text === "string");

function trimHistory(messages) {
  let trimmed = messages.slice(-config.maxHistory);
  while (trimmed.length && !isPlainUserMessage(trimmed[0])) {
    trimmed = trimmed.slice(1);
  }
  return trimmed;
}

router.post("/chat", async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    if (!message || typeof message !== "string" || message.length > 2000) {
      return res.status(400).json({ error: "message must be a string up to 2000 characters" });
    }

    const convo = conversationId
      ? await Conversation.findById(conversationId)
      : await Conversation.create({});
    if (!convo) return res.status(404).json({ error: "Conversation not found" });

    convo.messages.push({ role: "user", parts: [{ text: message }] });

    const history = trimHistory(convo.messages);
    const { text, messages, trace } = await runAgent(history);

    // Everything after the history we sent is new (model + function turns)
    convo.messages.push(...messages.slice(history.length));
    convo.markModified("messages");
    await convo.save();

    res.json({ conversationId: convo._id, reply: text, trace });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message }); // show real error while learning
  }
});

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// List past conversations (newest first). Optional ?q= searches message text.
router.get("/conversations", async (req, res) => {
  try {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const filter = q
      ? { "messages.parts.text": new RegExp(escapeRegex(q), "i") }
      : { "messages.0": { $exists: true } }; // skip empty conversations
    const convos = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .limit(30)
      .select({ messages: { $slice: 1 }, updatedAt: 1 }); // only the first message, for the title

    const conversations = convos.map((c) => {
      const first =
        c.messages[0]?.parts?.find((p) => typeof p.text === "string")?.text || "New chat";
      return {
        id: c._id,
        title: first.length > 50 ? first.slice(0, 50) + "…" : first,
        updatedAt: c.updatedAt,
      };
    });
    res.json({ conversations });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Return only the human-readable messages for the UI
router.get("/conversations/:id", async (req, res) => {
  try {
    const convo = await Conversation.findById(req.params.id);
    if (!convo) return res.status(404).json({ error: "Not found" });
    const visible = convo.messages
      .map((m) => {
        const text = (m.parts || []).filter((p) => typeof p.text === "string" && !p.thought).map((p) => p.text).join("\n");
        return text ? { role: m.role === "model" ? "assistant" : "user", text } : null;
      })
      .filter(Boolean);
    res.json({ messages: visible });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

export default router;
