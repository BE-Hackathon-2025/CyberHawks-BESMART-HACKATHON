import { useEffect, useState } from "react";
import { FaPaperPlane } from "react-icons/fa";

const AI_Queary = ({ activeHub = "PA" }) => {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [summaryLoading, setSummaryLoading] = useState(false);

  useEffect(() => {
    loadPostsSummary();
  }, [activeHub]);

  //-------------------------------------
  //Load posts summary for the active hub

  const loadPostsSummary = async () => {
    setSummaryLoading(true);
    try {
      const res = await fetch(
        `http://172.20.152.126:5000/api/posts/summary?hub=${activeHub}`
      );
      const data = await res.json();

      if (res.ok && data.summary) {
        // Add summary as the first AI message
        setMessages([
          {
            role: "ai",
            content: `📊 **Recent Community Summary for ${activeHub}:**\n\n${data.summary}`,
          },
        ]);
      }
    } catch (error) {
      console.error("Error loading posts summary:", error);
      // Don't show error to user, just continue without summary
    } finally {
      setSummaryLoading(false);
    }
  };

  //________________________________

  const [sessionId] = useState(() => {
    // If crypto not available, fallback to timestamp
    if (window.crypto?.randomUUID) {
      return window.crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  });

  const SendQueary = async (e) => {
    e.preventDefault();
    const text = query.trim();
    if (!text) return;
    //console.log("sent query:", query);
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://172.20.152.126:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: text, sessionId }),
      });

      const data = await res.json();
      // setResponse(data.response);
      if (!res.ok) {
        throw new Error(data.error || "Error fetching AI response");
      }
      console.log("AI response:", data.response);
      const aiResponse =
        data.response ||
        (data.messages && data.messages.length > 0
          ? data.messages[data.messages.length - 1].content
          : "No response received");

      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "ai", content: data.response },
      ]);
      setQuery("");
    } catch (error) {
      console.error("Error fetching AI response:", error);
      setError(error.message || "Error fetching AI response");
    } finally {
      setLoading(false);
    }
  };

  //

  return (
    <div className="ai-queary ai-panel ai-chat">
      <h4>Hub Pal - AI Assistant</h4>

      <div className="ai-messages">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={
              msg.role === "user" ? "ai-msg ai-msg-user" : "ai-msg ai-msg-ai"
            }
          >
            <strong>{msg.role === "user" ? "You: " : "AI: "}</strong>
            <span>{msg.content}</span>
          </div>
        ))}
        {loading && <p className="ai-status">Thinking...</p>}
        {error && <p className="ai-error">{error}</p>}
      </div>

      <form className="ai-response-form" onSubmit={SendQueary}>
        <input
          type="text"
          className="ai-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask HubbyP about the community..."
        />
        <button type="submit" className="ai-submit-button" disabled={loading}>
          <FaPaperPlane />
        </button>
      </form>
    </div>
  );
};

export default AI_Queary;
