import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

function formatStamp(d) {
  const date = new Date(d);
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function Sidebar({ items, search, setSearch, selected, onSelect }) {
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();

  return (
    <aside className="sidebar">
      <div className="sidebar-head">
        <strong>{user.username}</strong>
        <button onClick={logout}>Logout</button>
      </div>

      <input
        className="search"
        placeholder="Users search karo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="user-list">
        {items.length === 0 && <p className="muted">Koi user nahi mila</p>}
        {items.map(({ user: u, lastMessage, unread }) => (
          <div
            key={u._id}
            className={`user-item ${selected?._id === u._id ? "active" : ""}`}
            onClick={() => onSelect(u)}
          >
            <span className={`dot ${onlineUsers.has(u._id) ? "online" : ""}`} />
            <div className="user-info">
              <span className="user-name">{u.username}</span>
              {lastMessage && (
                <span className="preview">
                  {lastMessage.sender === user.id ? "You: " : ""}
                  {lastMessage.text}
                </span>
              )}
            </div>
            <div className="meta">
              {lastMessage && <small>{formatStamp(lastMessage.createdAt)}</small>}
              {unread > 0 && <span className="badge">{unread}</span>}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}