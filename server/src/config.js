import "dotenv/config";

export const config = {
  port: process.env.PORT || 4000,
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/agent_assistant",
  model: process.env.MODEL || "gemini-flash-latest",
  maxSteps: 6,        // safety cap on the agent loop
  maxHistory: 30,     // how many past messages we send to the model
};
