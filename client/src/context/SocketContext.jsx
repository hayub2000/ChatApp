import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return;

    const s = io("http://localhost:5000", {
      auth: { token: localStorage.getItem("token") },
    });

    s.on("onlineUsers", (ids) => setOnlineUsers(new Set(ids)));
    s.on("userOnline", (id) => setOnlineUsers((prev) => new Set(prev).add(id)));
    s.on("userOffline", (id) =>
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      })
    );

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", (err) => {
      setConnected(false);
      // Token galat ya expire ho to logout
      if (err.message === "Invalid token" || err.message === "No token") logout();
    });

    setSocket(s);

    // Logout ya unmount par connection band
    return () => {
      s.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, connected }}>
      {children}
    </SocketContext.Provider>
  );
}