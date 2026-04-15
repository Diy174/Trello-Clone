import express from "express";
import {
  createList,
  updateList,
  deleteList,
  reorderLists,
} from "../controllers/listController.js";

const router = express.Router();

router.post("/boards/:boardId/lists", createList);
router.put("/reorder", reorderLists);
router.put("/:id", updateList);
router.delete("/:id", deleteList);

export default router;