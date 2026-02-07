const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 20,
    },
    password: { type: String, required: true },
    status: { type: String, enum: ["idle", "fighting"], default: "idle" },
    currentFightId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model("User", UserSchema);
