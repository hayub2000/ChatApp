import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUsers, connected } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [found, setFound] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  const selectedRef = useRef(null);
  selectedRef.current = selected;
  const conversationsRef = useRef([]);
  conversationsRef.current = conversations;

  const loadConversations = useCallback(() => {
    api
      .get("/conversations")
      .then((res) => setConversations(res.data.conversations))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Search ke 300ms baad users ki list
  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get("/users", { params: { search } })
        .then((res) => setFound(res.data.users))
        .catch(() => setFound([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Socket reconnect hone par miss hue messages dobara load karo
  useEffect(() => {
    if (!socket) return;
    socket.on("connect", loadConversations);
    return () => socket.off("connect", loadConversations);
  }, [socket, loadConversations]);

  // Naya message aane par sidebar update
  useEffect(() => {
    if (!socket) return;

    const onNew = (m) => {
      const fromMe = m.sender === user.id;
      const partnerId = fromMe ? m.receiver : m.sender;
      const isOpen = selectedRef.current?._id === partnerId;

      // Jis ki chat khuli hai, uska message foran read mark karo
      const markRead =
        !fromMe && isOpen
          ? api.patch(`/messages/${partnerId}/read`).catch(() => {})
          : Promise.resolve();

      const exists = conversationsRef.current.some((c) => c.user._id === partnerId);
      if (!exists) {
        // Naya banda: uski info server se lo
        markRead.then(loadConversations);
        return;
      }

      setConversations((prev) => {
        const current = prev.find((c) => c.user._id === partnerId);
        if (!current) return prev;
        const updated = {
          ...current,
          lastMessage: { text: m.text, sender: m.sender, createdAt: m.createdAt },
          unread: fromMe ? current.unread : isOpen ? 0 : current.unread + 1,
        };
        return [updated, ...prev.filter((c) => c.user._id !== partnerId)];
      });
    };

    socket.on("newMessage", onNew);
    return () => socket.off("newMessage", onNew);
  }, [socket, user.id, loadConversations]);

  const handleSelect = (u) => {
    setSelected(u);
    api.patch(`/messages/${u._id}/read`).catch(() => {});
    setConversations((prev) =>
      prev.map((c) => (c.user._id === u._id ? { ...c, unread: 0 } : c))
    );
  };

  // Sidebar ki list: pehle jin se chat hai (naye upar), phir baaki users
  const q = search.trim().toLowerCase();
  const chatItems = conversations.filter(
    (c) => !q || c.user.username.toLowerCase().includes(q)
  );
  const chatIds = new Set(conversations.map((c) => c.user._id));
  const otherItems = found
    .filter((u) => !chatIds.has(u._id))
    .map((u) => ({ user: u, lastMessage: null, unread: 0 }));
  const items = [...chatItems, ...otherItems];

  return (
    <div className={`chat-layout ${selected ? "has-chat" : ""}`}>
      {!connected && <div className="banner">Connection lost, trying to reconnect...</div>}
      <Sidebar
        items={items}
        search={search}
        setSearch={setSearch}
        selected={selected}
        onSelect={handleSelect}
      />
      {selected ? (
        <ChatWindow
          key={selected._id}
          other={selected}
          online={onlineUsers.has(selected._id)}
          onBack={() => setSelected(null)}
        />
      ) : (
        <div className="chat-main empty">
          <p>Chat shuru karne ke liye left se kisi user ko chuno</p>
        </div>
      )}
    </div>
  );
}