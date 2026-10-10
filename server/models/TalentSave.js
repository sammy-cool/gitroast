const mongoose = require("mongoose");

const talentSaveSchema = new mongoose.Schema(
  {
    recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    username: { type: String, required: true, lowercase: true, trim: true },
    note: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true },
);
talentSaveSchema.index({ recruiterId: 1, username: 1 }, { unique: true });

module.exports = mongoose.model("TalentSave", talentSaveSchema);
