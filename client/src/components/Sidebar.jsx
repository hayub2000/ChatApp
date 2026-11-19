import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Sidebar({ users, search, setSearch, selected, onSelect, unread }) {
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
        {users.length === 0 && <p className="muted">Koi user nahi mila</p>}
        {users.map((u) => (
          <div
            key={u._id}
            className={`user-item ${selected?._id === u._id ? "active" : ""}`}
            onClick={() => onSelect(u)}
          >
            <span className={`dot ${onlineUsers.has(u._id) ? "online" : ""}`} />
            <span className="user-name">{u.username}</span>
            {unread[u._id] > 0 && <span className="badge">{unread[u._id]}</span>}
          </div>
        ))}
      </div>
    </aside>
  );
}