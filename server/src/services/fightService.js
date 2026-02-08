const Fight = require("../models/fight.js");
const User = require("../models/user.js");

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function createFight(playerA, playerB) {
  playerA = playerA.toLowerCase();
  playerB = playerB.toLowerCase();

  const firstTurn = Math.random() < 0.5 ? "A" : "B";

  const fight = await Fight.create({
    playerA,
    playerB,
    currentTurn: firstTurn,
    state: "active",
    log: [`Fight started. Player ${firstTurn} goes first.`],
  });

  await User.updateMany(
    {
      username: { $in: [playerA, playerB] },
    },
    { status: "fighting" },
  );

  return fight;
}

async function getFight(fightId) {
  return await Fight.findById(fightId);
}

async function applyAction(fightId, actingPlayer, action) {
  const fight = await getFight(fightId);
  if (!fight) throw new Error("Fight not found");
  if (fight.state !== "active") throw new Error("Fight is not active");

  const isA = actingPlayer === fight.playerA;
  const expectedTurn =
    fight.currentTurn === "A" ? fight.playerA : fight.playerB;

  if (actingPlayer !== expectedTurn) {
    throw new Error("Not your turn");
  }

  let logEntry = "";
  let damage = 0;
  let selfDamage = 0;

  if (action === "PUNCH") {
    damage = randomBetween(10, 20);
    logEntry = `${actingPlayer} punches for ${damage} damage.`;
  } else if (action === "KICK") {
    const fell = Math.random() < 0.3;

    if (fell) {
      selfDamage = randomBetween(5, 15);
      logEntry = `${actingPlayer} attempted to kick, fell, and took ${selfDamage} damage.`;
    } else {
      damage = randomBetween(20, 30);
      logEntry = `${actingPlayer} kicks for ${damage} damage`;
    }
  } else if (action === "FLEE") {
    fight.state = "finished";
    fight.winner = isA ? fight.playerB : fight.playerA;
    fight.log.push(`${actingPlayer} fled the fight.`);
    await fight.save();

    await User.updateMany(
      {
        username: { $in: [fight.playerA, fight.playerB] },
      },
      { status: "idle" },
    );

    return fight;
  } else {
    throw new Error("Invalid action");
  }

  if (isA) {
    fight.healthB -= damage;
    fight.healthA -= selfDamage;
  } else {
    fight.healthA -= damage;
    fight.healthB -= selfDamage;
  }

  fight.log.push(logEntry);

  if (fight.healthA <= 0 || fight.healthB <= 0) {
    fight.state = "finished";
    fight.winner = fight.healthA <= 0 ? fight.playerB : fight.playerA;
    fight.log.push(`${fight.winner} wins the fight.`);

    await fight.save();

    await User.updateMany(
      {
        username: { $in: [fight.playerA, fight.playerB] },
      },
      { status: "idle" },
    );

    return fight;
  }

  fight.currentTurn = fight.currentTurn === "A" ? "B" : "A";
  await fight.save();

  return fight;
}

module.exports = {
  createFight,
  getFight,
  applyAction,
};
