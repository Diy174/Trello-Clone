import express from "express";
import { getAllMembers, getBoardLabels } from "../controllers/metaController.js";

const router = express.Router();

router.get("/members", getAllMembers);
router.get("/boards/:boardId/labels", getBoardLabels);

export default router;