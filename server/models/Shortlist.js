const mongoose = require("mongoose");

const shortlistSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    roleKey: { type: String, default: "senior-ic" },
    members: { type: [String], default: [] }, // lowercase GitHub usernames
    sharedWithCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Shortlist", shortlistSchema);
