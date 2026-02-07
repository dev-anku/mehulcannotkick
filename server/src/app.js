require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/authRoutes.js");

const app = express();

app.use(
  cors({
    origin: process.env.CLIENT_URL,
  }),
);
app.use(express.json());

app.get("/check", (req, res) => {
  res.json({ status: "mehul is fat" });
});
app.use("/auth", authRoutes);

module.exports = app;
