import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user, logout } = useAuth();
  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome, {user.username}</h2>
      <p>Chat UI agle phase mein banegi.</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}