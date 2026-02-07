const mongoose = require("mongoose");

const ChallengeSchema = new mongoose.Schema(
  {
    fromUser: {
      type: String,
      required: true,
      lowercase: true,
    },
    toUser: {
      type: String,
      required: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "expired"],
      default: "pending",
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Challenge", ChallengeSchema);
