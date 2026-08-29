import { useEffect, useRef, useState } from "react";
import { FaComments, FaPaperPlane, FaTrash } from "react-icons/fa";
import { getMessages, sendMessage, deleteMessage, type ChatMessage } from "../services/chatApi";
import { useAuth } from "../context/AuthContext";

const POLL_INTERVAL_MS = 4000;

const Chat = () => {
  const { user, isAdmin } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadMessages = async () => {
    try {
      const data = await getMessages();
      setMessages(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;

    setSending(true);
    try {
      await sendMessage(text);
      setDraft("");
      await loadMessages();
    } catch (error) {
      console.error(error);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this message for everyone?")) return;
    try {
      await deleteMessage(id);
      await loadMessages();
    } catch (error) {
      console.error(error);
      alert("Failed to delete message.");
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso.includes("T") ? iso : iso.replace(" ", "T") + "Z");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="page-container">
      <div className="page-title-row">
        <h1 className="page-title">
          <FaComments /> Team Chat
        </h1>
      </div>

      <div className="form-card chat-card">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="chat-empty">No messages yet - say hello 👋</div>
          )}

          {messages.map((m) => {
            const isMine = m.username === user?.username;
            return (
              <div
                key={m.id}
                className={`chat-bubble-row ${isMine ? "chat-mine" : ""}`}
              >
                <div className="chat-bubble">
                  <div className="chat-bubble-meta">
                    <span className="chat-bubble-name">{m.username}</span>
                    {m.role === "admin" && (
                      <span className="chat-badge-admin">Admin</span>
                    )}
                    <span className="chat-bubble-time">{formatTime(m.createdAt)}</span>
                    {isAdmin && (
                      <button
                        type="button"
                        className="chat-delete-btn"
                        onClick={() => handleDelete(m.id)}
                        title="Delete message"
                      >
                        <FaTrash />
                      </button>
                    )}
                  </div>
                  <div className="chat-bubble-text">{m.message}</div>
                </div>
              </div>
            );
          })}

          <div ref={bottomRef} />
        </div>

        <form className="chat-input-row" onSubmit={handleSend}>
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            autoFocus
          />
          <button type="submit" className="chat-send-btn" disabled={sending || !draft.trim()}>
            <FaPaperPlane />
            &nbsp; Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Chat;
