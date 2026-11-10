import express from "express";
import cors from "cors";
import { config } from "./config.js";
import { connectDB } from "./db.js";
import chatRoutes from "./routes/chat.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());
app.use("/api", chatRoutes);

await connectDB();
app.listen(config.port, () => console.log(`Server on http://localhost:${config.port}`));
