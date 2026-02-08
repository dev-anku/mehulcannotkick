const mongoose = require("mongoose");

const FightSchema = new mongoose.Schema(
  {
    playerA: { type: String, required: true, lowercase: true },
    playerB: { type: String, required: true, lowercase: true },

    healthA: { type: Number, default: 100 },
    healthB: { type: Number, default: 100 },

    currentTurn: {
      type: String,
      enum: ["A", "B"],
      required: true,
    },

    state: {
      type: String,
      enum: ["pending", "active", "finished"],
      default: "pending",
    },

    winner: {
      type: String,
      default: null,
    },

    log: [{ type: String, timestamp: { type: Date, default: Date.now } }],
  },
  { timestamps: true },
);

module.exports = mongoose.model("Fight", FightSchema);
