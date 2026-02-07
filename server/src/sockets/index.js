const { Server } = require("socket.io");
const socketAuth = require("./auth.js");
const { addUser, removeUser, getOnlineUsers } = require("./onlineUsers.js");

function initSockets(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      methods: ["GET", "POST"],
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    const username = socket.user.username;

    console.log(`Socket connected: ${username} (${socket.id})`);

    addUser(username, socket.id);

    socket.emit("connected", {
      username,
      onlineUsers: getOnlineUsers(),
    });

    socket.broadcast.emit("online_users", getOnlineUsers());

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${username}`);
      removeUser(username);
      socket.broadcast.emit("online_users", getOnlineUsers());
    });
  });

  return io;
}

module.exports = initSockets;
