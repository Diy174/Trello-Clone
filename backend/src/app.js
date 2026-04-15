import express from "express";
import cors from "cors";
import boardRoutes from "./routes/boardRoutes.js";
import listRoutes from "./routes/listRoutes.js";
import cardRoutes from "./routes/cardRoutes.js";
import metaRoutes from "./routes/metaRoutes.js";

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://trello-clone-three-rho.vercel.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/boards", boardRoutes);
app.use("/api/lists", listRoutes);
app.use("/api/cards", cardRoutes);
app.use("/api/meta", metaRoutes);

export default app;