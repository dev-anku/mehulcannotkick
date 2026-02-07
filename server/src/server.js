require("dotenv").config();
const http = require("http");
const mongoose = require("mongoose");
const app = require("./app.js");
const initSockets = require("./sockets");

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected!");

    const server = http.createServer(app);

    initSockets(server);

    server.listen(PORT, () => {
      console.log(`Server running on ${PORT}`);
    });
  } catch (err) {
    console.error("Database connection error:", err);
    process.exit(1);
  }
})();
