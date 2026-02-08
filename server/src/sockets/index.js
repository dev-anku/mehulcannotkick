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
const { createFight, applyAction } = require("../services/fightService.js");

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

        const fight = await createFight(challenge.fromUser, challenge.toUser);

        const fromSocketId = getSocketId(challenge.fromUser);
        const toSocketId = getSocketId(challenge.toUser);

        const fightPayload = {
          fightId: fight._id,
          playerA: fight.playerA,
          playerB: fight.playerB,
          healthA: fight.healthA,
          healthB: fight.healthB,
          currentTurn: fight.currentTurn,
          log: fight.log,
        };

        if (fromSocketId) {
          io.to(fromSocketId).emit("fight_started", fightPayload);
        }
        if (toSocketId) {
          io.to(toSocketId).emit("fight_started", fightPayload);
        }
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
        socket.emit("error_message", { message: err.message });
      }
    });

    socket.on("fight_action", async ({ fightId, action }) => {
      try {
        const updatedFight = await applyAction(
          fightId,
          socket.user.username,
          action,
        );

        const payload = {
          fightId: updatedFight._id,
          healthA: updatedFight.healthA,
          healthB: updatedFight.healthB,
          currentTurn: updatedFight.currentTurn,
          state: updatedFight.state,
          winner: updatedFight.winner,
          log: updatedFight.log,
        };

        const socketA = getSocketId(updatedFight.playerA);
        const socketB = getSocketId(updatedFight.playerB);

        if (socketA) io.to(socketA).emit("fight_update", payload);
        if (socketB) io.to(socketB).emit("fight_update", payload);
      } catch (err) {
        socket.emit("error_message", { message: err.message });
      }
    });
  });

  return io;
}

module.exports = initSockets;
