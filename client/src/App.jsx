import { useEffect, useRef, useState } from "react";
import { sendMessage, loadConversation, listConversations } from "./api.js";

function ToolTrace({ trace }) {
  if (!trace?.length) return null;
  return (
    <details className="trace">
      <summary>Used {trace.length} tool{trace.length > 1 ? "s" : ""}</summary>
      {trace.map((t, i) => (
        <div key={i} className={t.isError ? "step error" : "step"}>
          <strong>{t.tool}</strong>
          <code>{JSON.stringify(t.input)}</code>
          <pre>{t.output}</pre>
        </div>
      ))}
    </details>
  );
}

function formatDate(iso) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function App() {
  const [conversationId, setConversationId] = useState(localStorage.getItem("convoId"));
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const [history, setHistory] = useState([]);
  const [query, setQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  // Load the open conversation on first visit
  useEffect(() => {
    if (conversationId) loadConversation(conversationId).then((m) => m && setMessages(m));
  }, []);

  // Fetch history; wait 300ms after typing stops so we don't search on every key
  useEffect(() => {
    const timer = setTimeout(() => listConversations(query).then(setHistory), 300);
    return () => clearTimeout(timer);
  }, [query, conversationId, messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setLoading(true);
    try {
      const data = await sendMessage(conversationId, text);
      setConversationId(data.conversationId);
      localStorage.setItem("convoId", data.conversationId);
      setMessages((m) => [...m, { role: "assistant", text: data.reply, trace: data.trace }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "assistant", text: err.message, trace: [] }]);
    } finally {
      setLoading(false);
    }
  }

  function newChat() {
    localStorage.removeItem("convoId");
    setConversationId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function openConversation(id) {
    const m = await loadConversation(id);
    if (!m) return;
    setConversationId(id);
    localStorage.setItem("convoId", id);
    setMessages(m);
    setSidebarOpen(false);
  }

  return (
    <div className="shell">
      <aside className={sidebarOpen ? "sidebar open" : "sidebar"}>
        <input
          className="search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search past chats"
          aria-label="Search past chats"
        />
        <nav className="history">
          {history.length === 0 && (
            <p className="muted">{query ? `No chats mention "${query}".` : "No saved chats yet."}</p>
          )}
          {history.map((c) => (
            <button
              key={c.id}
              className={c.id === conversationId ? "item active" : "item"}
              onClick={() => openConversation(c.id)}
            >
              <span className="title">{c.title}</span>
              <span className="date">{formatDate(c.updatedAt)}</span>
            </button>
          ))}
        </nav>
      </aside>

      <div className="app">
        <header>
          <button className="toggle" onClick={() => setSidebarOpen((o) => !o)}>History</button>
          <h1>Notebook Assistant</h1>
          <button onClick={newChat}>New chat</button>
        </header>

        <main>
          {messages.length === 0 && (
            <p className="empty">
              Try: "Remember that my exam is on 20 December", then later "When is my exam?"
              Or: "What is 18% of 2,450?"
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`msg ${m.role}`}>
              <p>{m.text}</p>
              <ToolTrace trace={m.trace} />
            </div>
          ))}
          {loading && <div className="msg assistant thinking">Working…</div>}
          <div ref={bottomRef} />
        </main>

        <footer>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask, or tell me something to remember"
            maxLength={2000}
          />
          <button onClick={handleSend} disabled={loading || !input.trim()}>Send</button>
        </footer>
      </div>
    </div>
  );
}
