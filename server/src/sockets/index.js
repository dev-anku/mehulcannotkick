const { Server } = require("socket.io");
const socketAuth = require("./auth.js");
const {
  addUser,
  removeUser,
  getOnlineUsers,
  getSocketId,
} = require("./onlineUsers.js");
const Challenge = require("../models/challenge.js");
const {
  createChallenge,
  updateChallengeStatus,
} = require("../services/challengeService.js");

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

    socket.on("send_challenge", async ({ toUser }) => {
      try {
        const fromUser = socket.user.username;
        const challenge = await createChallenge(fromUser, toUser);

        const targetSocketId = getSocketId(toUser.toLowerCase());
        if (!targetSocketId) {
          socket.emit("error_message", {
            message: "User is not online",
          });
          return;
        }

        io.to(targetSocketId).emit("receive_challenge", {
          challengeId: challenge._id,
          fromUser,
        });

        socket.emit("challenge_sent", {
          challengeId: challenge._id,
          toUser,
        });
      } catch (err) {
        socket.emit("error_message", { message: err.message });
      }
    });

    socket.on("accept_challenge", async ({ challengeId }) => {
      try {
        const challenge = await updateChallengeStatus(challengeId, "accepted");

        const fromSocketId = getSocketId(challenge.fromUser);

        if (fromSocketId) {
          io.to(fromSocketId).emit("challenge_accepted", {
            challengeId,
            by: socket.user.username,
          });
        }

        socket.emit("challenge_accepted_confirm", { challengeId });
      } catch (err) {
        socket.emit("error_message", { message: err.message });
      }
    });

    socket.on("reject_challenge", async ({ challengeId }) => {
      try {
        const challenge = await updateChallengeStatus(challengeId, "rejected");

        const fromSocketId = getSocketId(challenge.fromUser);

        if (fromSocketId) {
          io.to(fromSocketId).emit("challenge_rejected", {
            challengeId,
            by: socket.user.username,
          });
        }
        socket.emit("challenge_rejected_confirm", { challengeId });
      } catch (err) {
        socket.emit("error_messsage", { message: err.message });
      }
    });
  });

  return io;
}

module.exports = initSockets;
