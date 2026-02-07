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

module.exports = {
  addUser,
  removeUser,
  getSocketId,
  getOnlineUsers,
};
