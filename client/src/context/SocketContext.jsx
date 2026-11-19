import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);
export const useSocket = () => useContext(SocketContext);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
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

    setSocket(s);

    // Logout ya unmount par connection band
    return () => {
      s.disconnect();
      setSocket(null);
      setOnlineUsers(new Set());
    };
  }, [userId]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
}