const User = require("../models/user.js");
const onlineUsers = new Map();

function addUser(username, socketId, io) {
  const existing = onlineUsers.get(username);

  if (existing) {
    io.to(existing.socketId).emit("force_disconnect");
    io.sockets.sockets.get(existing.socketId)?.disconnect();
  }

  onlineUsers.set(username, { socketId });
}

function removeUser(username) {
  onlineUsers.delete(username);
}

function getSocketId(username) {
  return onlineUsers.get(username)?.socketId;
}

function getOnlineUsers() {
  return Array.from(onlineUsers.keys());
}

async function isUserInFight(username) {
  const user = await User.findOne({ username });
  return user?.status === "fighting";
}

module.exports = {
  addUser,
  removeUser,
  getSocketId,
  getOnlineUsers,
  isUserInFight,
};
