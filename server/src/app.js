import express from "express";

const app = express();

app.use(express.json());

import authRoutes from "./routes/authRoutes.js";
app.use("/api/auth", authRoutes);

export default app;
