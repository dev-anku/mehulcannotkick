import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    status: { type: String, enum: ["idle", "fighting"], default: "idle" },
    currentFightId: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { timestamps: true },
);

export default mongoose.model("User", userSchema);
