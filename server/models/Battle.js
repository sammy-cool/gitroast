const mongoose = require("mongoose");

const battleSchema = new mongoose.Schema(
  {
    user1: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    user2: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    avatarUrl1: {
      type: String,
      default: null,
    },
    avatarUrl2: {
      type: String,
      default: null,
    },
    score1: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    score2: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    grade1: {
      type: String,
      default: "C",
    },
    grade2: {
      type: String,
      default: "C",
    },
    winner: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    loser: {
      type: String,
      trim: true,
      lowercase: true,
      default: null,
    },
    roast1: {
      type: String,
      default: "",
    },
    roast2: {
      type: String,
      default: "",
    },
    battleRoast: {
      type: String,
      default: "",
    },
    intensity: {
      type: String,
      enum: ["warm", "crispy", "nuclear", "mild", "savage"],
      default: "savage",
    },
    battleSource: {
      type: String,
      enum: ["ai", "rules"],
      default: "rules",
    },
    category: {
      type: String,
      default: "overall",
    },
    stats1: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    stats2: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    reactions: {
      relatable: { type: Number, default: 0 },
      destroyed: { type: Number, default: 0 },
      savage: { type: Number, default: 0 },
    },
    shareCount: {
      type: Number,
      default: 0,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
    rematchCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

battleSchema.index({ user1: 1, user2: 1 });
battleSchema.index({ winner: 1, createdAt: -1 });
battleSchema.index({ createdAt: -1 });
battleSchema.index({ "reactions.savage": -1, "reactions.destroyed": -1, createdAt: -1 });

battleSchema.statics.addReaction = function (id, type) {
  const allowed = ["relatable", "destroyed", "savage"];
  if (!allowed.includes(type)) throw new Error("Invalid reaction type");
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return this.findByIdAndUpdate(
    id,
    { $inc: { [`reactions.${type}`]: 1 } },
    { returnDocument: "after", select: "reactions" }
  );
};

battleSchema.statics.incrementView = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return this.findByIdAndUpdate(
    id,
    { $inc: { viewCount: 1 } },
    { returnDocument: "after", select: "viewCount" }
  );
};

battleSchema.statics.incrementShare = function (id) {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return this.findByIdAndUpdate(
    id,
    { $inc: { shareCount: 1 } },
    { returnDocument: "after", select: "shareCount" }
  );
};

module.exports = mongoose.model("Battle", battleSchema);

