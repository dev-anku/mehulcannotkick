import { useEffect, useState } from "react";
import { getSocket } from "../socket/socket";

export default function Lobby() {
  const [status, setStatus] = useState("disconnected");

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    socket.on("connect", () => setStatus("connected"));
    socket.on("disconnect", () => setStatus("disconnected"));

    return () => {
      socket.off();
    };
  }, []);

  return (
    <div>
      <h2>Lobby</h2>
      <p>Socket status: {status}</p>
    </div>
  );
}

