import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import User from "./models/user.js";

export const onlineUsers = new Map();

export const setupSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { userId, username } = socket.user;

    onlineUsers.set(userId, {
      username,
      socketId: socket.id,
    });

    console.log(`${username} connected`);

    socket.on("disconnect", async () => {
      onlineUsers.delete(userId);
      console.log(`${username} disconnected`);
    });
  });

  return io;
};
