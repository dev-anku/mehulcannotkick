const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const User = require("../models/user.js");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ error: "Username and password are required!" });
  }

  const existing = await User.findOne({ username: username.toLowerCase() });
  if (existing) {
    return res.status(400).json({ error: "Username is already taken!" });
  }

  const hashed = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: username.toLowerCase(),
    password: hashed,
  });

  res.status(201).json({ userId: user._id, message: "User registered!" });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    return res.status(400).json({ error: "User not found!" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(400).json({ error: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      userId: user._id,
      username: user.username,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  res.json({ token, username: user.username });
});

module.exports = router;
