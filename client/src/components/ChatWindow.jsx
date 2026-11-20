import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function ChatWindow({ other, online }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  // 1. Purani history load karo
  useEffect(() => {
    let cancelled = false;
    api
      .get(`/messages/${other._id}`)
      .then((res) => {
        if (cancelled) return;
        const history = res.data.messages;
        const ids = new Set(history.map((m) => m._id));
        // history ke saath wo live messages bhi rakho jo load hone se pehle aa gaye
        setMessages((prev) => [...history, ...prev.filter((m) => !ids.has(m._id))]);
      })
      .catch(() => setError("History load nahi ho saki"));
    return () => {
      cancelled = true;
    };
  }, [other._id]);

  // 2. Live events sunno
  useEffect(() => {
    if (!socket) return;

    const onNew = (m) => {
      if (m.sender === other._id || m.receiver === other._id) {
        setMessages((prev) => (prev.some((x) => x._id === m._id) ? prev : [...prev, m]));
        if (m.sender === other._id) setTyping(false);
      }
    };
    const onTyping = ({ from }) =>  {
      if (from === other._id) setTyping(true);
    };
    const onStopTyping = ({ from }) => from === other._id && setTyping(false);

    socket.on("newMessage", onNew);
    socket.on("typing", onTyping);
    socket.on("stopTyping", onStopTyping);

    return () => {
      socket.off("newMessage", onNew);
      socket.off("typing", onTyping);
      socket.off("stopTyping", onStopTyping);
    };
  }, [socket, other._id]);

  // 3. Naya message aane par neeche scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const handleChange = (e) => {
    setText(e.target.value);
    if (!socket) return;
    socket.emit("typing", { to: other._id });
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(
      () => socket.emit("stopTyping", { to: other._id }),
      1500
    );
  };

  const send = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !socket) return;
    setError("");

    socket.emit("sendMessage", { to: other._id, text: t }, (res) => {
      if (res?.ok) {
        setMessages((prev) =>
          prev.some((x) => x._id === res.message._id) ? prev : [...prev, res.message]
        );
      } else {
        setError(res?.message || "Message nahi bheja ja saka");
      }
    });

    clearTimeout(typingTimer.current);
    socket.emit("stopTyping", { to: other._id });
    setText("");
  };

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="chat-main">
      <div className="chat-head">
      <div>
        <strong>{other.username}</strong>
          <div className="status">{typing ? "typing..." : online ? "online" : "offline"}</div>
      </div>
    </div>

      <div className="messages">
        {messages.map((m) => (
          <div key={m._id} className={`bubble ${m.sender === user.id ? "mine" : "theirs"}`}>
            <div>{m.text}</div>
            <small>{formatTime(m.createdAt)}</small>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {error && <div className="error chat-error">{error}</div>}

      <form className="composer" onSubmit={send}>
        <input
          placeholder="Message likho..."
          value={text}
          onChange={handleChange}
          maxLength={2000}
        />
        <button disabled={!text.trim()}>Send</button>
      </form>
    </div>
  );
}