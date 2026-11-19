import { useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const { user } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [unread, setUnread] = useState({});
  const selectedRef = useRef(null);
  selectedRef.current = selected;

  // Users ki list (search ke 300ms baad)
  useEffect(() => {
    const t = setTimeout(() => {
      api
        .get("/users", { params: { search } })
        .then((res) => setUsers(res.data.users))
        .catch(() => setUsers([]));
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Jis user ki chat khuli nahi, us ke naye messages ka unread count
  useEffect(() => {
    if (!socket) return;
    const onNew = (m) => {
      if (m.sender === user.id) return;
      if (selectedRef.current?._id !== m.sender) {
        setUnread((prev) => ({ ...prev, [m.sender]: (prev[m.sender] || 0) + 1 }));
      }
    };
    socket.on("newMessage", onNew);
    return () => socket.off("newMessage", onNew);
  }, [socket, user.id]);

  const handleSelect = (u) => {
    setSelected(u);
    setUnread((prev) => ({ ...prev, [u._id]: 0 }));
  };

  return (
    <div className="chat-layout">
      <Sidebar
        users={users}
        search={search}
        setSearch={setSearch}
        selected={selected}
        onSelect={handleSelect}
        unread={unread}
      />
      {selected ? (
        <ChatWindow key={selected._id} other={selected} online={onlineUsers.has(selected._id)} />
      ) : (
        <div className="chat-main empty">
          <p>Chat shuru karne ke liye left se kisi user ko chuno</p>
        </div>
      )}
    </div>
  );
}