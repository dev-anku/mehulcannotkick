import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import http from "http";
import app from "./app.js";
import { setupSocket } from "./socket.js";

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB);
    console.log("MongoDB connected");

    setupSocket(server);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Startup failed", err);
    process.exit(1);
  }
})();
