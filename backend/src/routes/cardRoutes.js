import express from "express";
import {
  createCard,
  updateCard,
  deleteCard,
  archiveCard,
  reorderCards,
  getCardDetails,
  updateCardDueDate,
  addLabelToCard,
  removeLabelFromCard,
  assignMemberToCard,
  removeMemberFromCard,
  createChecklist,
  createChecklistItem,
  updateChecklistItemStatus,
} from "../controllers/cardController.js";

const router = express.Router();

router.post("/lists/:listId/cards", createCard);
router.put("/reorder", reorderCards);

router.get("/:id/details", getCardDetails); 
router.put("/:id", updateCard);
router.put("/:id/due-date", updateCardDueDate);
router.put("/:id/archive", archiveCard);
router.delete("/:id", deleteCard);

router.post("/:cardId/labels/:labelId", addLabelToCard);
router.delete("/:cardId/labels/:labelId", removeLabelFromCard);

router.post("/:cardId/members/:memberId", assignMemberToCard);
router.delete("/:cardId/members/:memberId", removeMemberFromCard);

router.post("/:cardId/checklists", createChecklist);
router.post("/checklists/:checklistId/items", createChecklistItem);
router.put("/checklist-items/:itemId", updateChecklistItemStatus);

export default router;