const User = require("../models/user.js");
const onlineUsers = new Map();

function addUser(username, socketId) {
  onlineUsers.set(username, socketId);
}

function removeUser(username) {
  onlineUsers.delete(username);
}

function getSocketId(username) {
  return onlineUsers.get(username);
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
