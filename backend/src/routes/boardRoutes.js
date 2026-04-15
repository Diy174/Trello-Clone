import express from "express";
import {
  createBoard,
  getAllBoards,
  getBoardById,
} from "../controllers/boardController.js";

const router = express.Router();

router.post("/", createBoard);
router.get("/", getAllBoards);
router.get("/:id", getBoardById);

export default router;