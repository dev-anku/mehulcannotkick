const Challenge = require("../models/challenge.js");
const Fight = require("../models/fight.js");
const User = require("../models/user.js");
const challengeCooldown = new Map();

function checkCooldown(username) {
  const last = challengeCooldown.get(username);

  if (last && Date.now() - last < 3000)
    throw new Error("Wait before sending another challenge");

  challengeCooldown.set(username, Date.now());
}

async function createChallenge(fromUser, toUser) {
  fromUser = fromUser.toLowerCase();
  toUser = toUser.toLowerCase();

  if (fromUser == toUser) {
    throw new Error("You cannot challenge yourself");
  }

  const target = await User.findOne({ username: toUser });
  if (!target) {
    throw new Error("Target user does not exist");
  }

  checkCooldown(fromUser);

  if (target.status == "fighting") {
    throw new Error("User is already in a fight");
  }

  const activeFight = await Fight.findOne({
    state: "active",
    $or: [
      { playerA: fromUser },
      { playerB: fromUser },
      { playerA: toUser },
      { playerB: toUser },
    ],
  });

  if (activeFight) {
    throw new Error("One of the players is already in a fight");
  }

  const existing = await Challenge.findOne({
    fromUser,
    toUser,
    status: "pending",
  });
  if (existing) {
    throw new Error("You already have a pending challenge to this user");
  }

  const challenge = await Challenge.create({ fromUser, toUser });
  return challenge;
}

async function updateChallengeStatus(challengeId, status) {
  const challenge = await Challenge.findById(challengeId);
  if (!challenge) {
    throw new Error("Challenge not found");
  }

  challenge.status = status;
  await challenge.save();
  return challenge;
}

module.exports = {
  createChallenge,
  updateChallengeStatus,
};
