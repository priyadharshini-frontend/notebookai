# Notebook Assistant: learn AI agents with MERN (Gemini free-tier version)

A small agent that chats, does math, tells time, and saves/searches your notes in MongoDB.

## Run it
1. Start MongoDB locally (or use an Atlas URI).
2. Server:
   cd server
   npm install
   cp .env.example .env     # then paste your GEMINI_API_KEY (free from aistudio.google.com)
   npm run dev
3. Client (new terminal):
   cd client
   npm install
   npm run dev              # open http://localhost:5173

## Learn it in this order (read the file, then do the exercise)

| Stage | File to study | Exercise |
|---|---|---|
| 1 | server/src/agent/agent.js | Replace `tools` with an empty list. You now have a plain chatbot. Put tools back. |
| 2 | server/src/agent/tools/calculator.js | Ask "what is 18% of 2450?". Watch the `[tool]` log in the terminal. |
| 3 | server/src/agent/tools/notes.js | Say "remember my exam is on 20 Dec", then ask "when is my exam?" |
| 4 | server/src/routes/chat.js + models/Conversation.js | Refresh the page: history reloads from MongoDB. Find where it is trimmed. |
| 5 | client/src/App.jsx | Open "Used N tools" under an answer to see the agent's steps. |
| 6 | agent.js `maxSteps` | Set it to 1 and ask a question needing a tool. See what breaks, why caps matter. |

## Practice features (do these to really learn)
- Add a `delete_note` tool (hint: ask the user to confirm first via the system prompt).
- Add a `get_weather` tool using a free weather API.
- Make a tool throw an error on purpose; see how the model recovers.
- Stream the reply to the client (Server-Sent Events).
- Add Atlas Vector Search so `search_notes` finds notes by meaning, not just keywords.
- Write 10 test prompts and check that the right tool is called each time (a tiny eval).
