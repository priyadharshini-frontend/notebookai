export async function sendMessage(conversationId, message) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ conversationId, message }),
  });
  const text = await res.text();
  if (!text) throw new Error("Server not responding. Is it running on port 4000?");
  const data = JSON.parse(text);
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data; // { conversationId, reply, trace }
}

export async function loadConversation(id) {
  const res = await fetch(`/api/conversations/${id}`);
  if (!res.ok) return null;
  return (await res.json()).messages;
}

export async function listConversations(q = "") {
  const res = await fetch(`/api/conversations?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return (await res.json()).conversations;
}
