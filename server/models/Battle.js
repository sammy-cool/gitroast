// ============================================================
// GITROAST — Battle Model
// ============================================================
// WHAT: MongoDB schema for 1-on-1 developer roast battles.
//       Stores scores, comparative verdict, stats, and real-time reactions.
//
// WHY & FLOW:
//   - Battles are shareable via permalink (/battle/:user1/vs/:user2)
//   - Reactions (relatable, destroyed, savage) persisted in database
//   - Preserves reaction counts when rematching or reloading battle
// ============================================================

const mongoose = require("mongoose");

const battleSchema = new mongoose.Schema(
  {
    user1: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    user2: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
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
  },
  {
    timestamps: true,
  }
);

// WHY compound index: fast lookup when searching for an existing battle pair
battleSchema.index({ user1: 1, user2: 1 });
battleSchema.index({ createdAt: -1 });

// WHY static method for atomic reaction updates:
//   Avoids race conditions under concurrent clicks
//   Uses returnDocument: 'after' complying with Mongoose 8+ standards
battleSchema.statics.addReaction = function (id, type) {
  const allowed = ["relatable", "destroyed", "savage"];
  if (!allowed.includes(type)) throw new Error("Invalid reaction type");
  return this.findByIdAndUpdate(
    id,
    { $inc: { [`reactions.${type}`]: 1 } },
    { returnDocument: "after", select: "reactions" }
  );
};

module.exports = mongoose.model("Battle", battleSchema);
