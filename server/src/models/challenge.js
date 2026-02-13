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
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 2 * 60 * 1000),
    },
  },
  { timestamps: true },
);

ChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Challenge", ChallengeSchema);
