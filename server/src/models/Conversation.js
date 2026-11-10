import mongoose from "mongoose";

// We store messages exactly as the Anthropic API expects them
// ({ role, content }) so we can send them straight back later.
const conversationSchema = new mongoose.Schema(
  {
    messages: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

export const Conversation = mongoose.model("Conversation", conversationSchema);
