import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const Note = mongoose.model("Note", noteSchema);
