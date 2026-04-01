const express = require("express");
const router = express.Router();

const User = require("../models/user.js");
const { getSocketId } = require("../sockets/onlineUsers.js");

router.post("/", async (req, res) => {
  const user = await User.findById(req.user.userId);

  const now = new Date();
  const cooldown = 5 * 60 * 60 * 1000;

  if (user.lastClaim && now - user.lastClaim < cooldown) {
    const remaining = cooldown - (now - user.lastClaim);

    return res.status(400).json({
      error: "Not ready",
      remainingMs: remaining,
    });
  }

  user.coins += 100;
  user.lastClaim = now;
  await user.save();

  // const io = req.app.get("io");
  //
  // const socketId = getSocketId(user.username);
  // if (socketId) {
  //   io.to(socketId).emit("coins_update", {
  //     coins: user.coins,
  //   });
  // }

  res.json({
    coins: user.coins,
    nextClaimAt: new Date(now.getTime() + cooldown),
  });
});

router.get("/status", async (req, res) => {
  const user = await User.findById(req.user.userId);

  const now = new Date();
  const cooldown = 5 * 60 * 60 * 1000;

  if (!user.lastClaim) {
    return res.json({
      canClaim: true,
      remainingTime: 0,
    });
  }

  const diff = now - user.lastClaim;

  if (diff >= cooldown) {
    return res.json({
      canClaim: true,
      remainingTime: 0,
    });
  }

  return res.json({
    canClaim: false,
    remainingTime: cooldown - diff,
  });
});

module.exports = router;
