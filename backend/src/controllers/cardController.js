import db from "../config/db.js";

// Create a new card inside a list
export const createCard = async (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Card title is required",
      });
    }

    const [posRows] = await db.query(
      `SELECT COALESCE(MAX(position), 0) AS maxPosition
       FROM cards
       WHERE list_id = ?`,
      [listId]
    );

    const nextPosition = posRows[0].maxPosition + 1;

    const [result] = await db.query(
      `INSERT INTO cards (list_id, title, description, position)
       VALUES (?, ?, ?, ?)`,
      [listId, title, description || "", nextPosition]
    );

    return res.status(201).json({
      success: true,
      message: "Card created successfully",
      cardId: result.insertId,
    });
  } catch (error) {
    console.error("Create card error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create card",
    });
  }
};

// Update card title and description
export const updateCard = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Card title is required",
      });
    }

    await db.query(
      `UPDATE cards
       SET title = ?, description = ?
       WHERE id = ?`,
      [title, description || "", id]
    );

    return res.status(200).json({
      success: true,
      message: "Card updated successfully",
    });
  } catch (error) {
    console.error("Update card error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update card",
    });
  }
};

// Delete card permanently
export const deleteCard = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM cards WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Card deleted successfully",
    });
  } catch (error) {
    console.error("Delete card error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete card",
    });
  }
};

// Archive card
export const archiveCard = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE cards
       SET is_archived = TRUE
       WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "Card archived successfully",
    });
  } catch (error) {
    console.error("Archive card error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to archive card",
    });
  }
};

// Reorder cards
export const reorderCards = async (req, res) => {
  try {
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({
        success: false,
        message: "Cards data is required",
      });
    }

    for (const card of cards) {
      await db.query(
        `UPDATE cards
         SET list_id = ?, position = ?
         WHERE id = ?`,
        [card.list_id, card.position, card.id]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Cards reordered successfully",
    });
  } catch (error) {
    console.error("Reorder cards error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder cards",
    });
  }
};

// Get full card details
export const getCardDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const [cardRows] = await db.query(
      `SELECT * FROM cards WHERE id = ?`,
      [id]
    );

    if (cardRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Card not found",
      });
    }

    const [labels] = await db.query(
      `SELECT l.*
       FROM labels l
       INNER JOIN card_labels cl ON l.id = cl.label_id
       WHERE cl.card_id = ?`,
      [id]
    );

    const [members] = await db.query(
      `SELECT m.*
       FROM members m
       INNER JOIN card_members cm ON m.id = cm.member_id
       WHERE cm.card_id = ?`,
      [id]
    );

    const [checklists] = await db.query(
      `SELECT * FROM checklists
       WHERE card_id = ?
       ORDER BY position ASC`,
      [id]
    );

    const [items] = await db.query(
      `SELECT ci.*
       FROM checklist_items ci
       INNER JOIN checklists c ON ci.checklist_id = c.id
       WHERE c.card_id = ?
       ORDER BY ci.position ASC`,
      [id]
    );

    const checklistsWithItems = checklists.map((checklist) => ({
      ...checklist,
      items: items.filter((item) => item.checklist_id === checklist.id),
    }));

    return res.status(200).json({
      success: true,
      card: cardRows[0],
      labels,
      members,
      checklists: checklistsWithItems,
    });
  } catch (error) {
    console.error("Get card details error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch card details",
    });
  }
};

// Update due date
export const updateCardDueDate = async (req, res) => {
  try {
    const { id } = req.params;
    const { due_date } = req.body;

    await db.query(
      `UPDATE cards
       SET due_date = ?
       WHERE id = ?`,
      [due_date || null, id]
    );

    return res.status(200).json({
      success: true,
      message: "Due date updated successfully",
    });
  } catch (error) {
    console.error("Update due date error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update due date",
    });
  }
};

// Add label to card
export const addLabelToCard = async (req, res) => {
  try {
    const { cardId, labelId } = req.params;

    await db.query(
      `INSERT IGNORE INTO card_labels (card_id, label_id)
       VALUES (?, ?)`,
      [cardId, labelId]
    );

    return res.status(200).json({
      success: true,
      message: "Label added successfully",
    });
  } catch (error) {
    console.error("Add label to card error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add label",
    });
  }
};

// Remove label from card
export const removeLabelFromCard = async (req, res) => {
  try {
    const { cardId, labelId } = req.params;

    await db.query(
      `DELETE FROM card_labels
       WHERE card_id = ? AND label_id = ?`,
      [cardId, labelId]
    );

    return res.status(200).json({
      success: true,
      message: "Label removed successfully",
    });
  } catch (error) {
    console.error("Remove label error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove label",
    });
  }
};

// Assign member to card
export const assignMemberToCard = async (req, res) => {
  try {
    const { cardId, memberId } = req.params;

    await db.query(
      `INSERT IGNORE INTO card_members (card_id, member_id)
       VALUES (?, ?)`,
      [cardId, memberId]
    );

    return res.status(200).json({
      success: true,
      message: "Member assigned successfully",
    });
  } catch (error) {
    console.error("Assign member error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign member",
    });
  }
};

// Remove member from card
export const removeMemberFromCard = async (req, res) => {
  try {
    const { cardId, memberId } = req.params;

    await db.query(
      `DELETE FROM card_members
       WHERE card_id = ? AND member_id = ?`,
      [cardId, memberId]
    );

    return res.status(200).json({
      success: true,
      message: "Member removed successfully",
    });
  } catch (error) {
    console.error("Remove member error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to remove member",
    });
  }
};

// Create checklist
export const createChecklist = async (req, res) => {
  try {
    const { cardId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Checklist title is required",
      });
    }

    const [posRows] = await db.query(
      `SELECT COALESCE(MAX(position), 0) AS maxPosition
       FROM checklists
       WHERE card_id = ?`,
      [cardId]
    );

    const nextPosition = posRows[0].maxPosition + 1;

    const [result] = await db.query(
      `INSERT INTO checklists (card_id, title, position)
       VALUES (?, ?, ?)`,
      [cardId, title, nextPosition]
    );

    return res.status(201).json({
      success: true,
      message: "Checklist created successfully",
      checklistId: result.insertId,
    });
  } catch (error) {
    console.error("Create checklist error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checklist",
    });
  }
};

// Add checklist item
export const createChecklistItem = async (req, res) => {
  try {
    const { checklistId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Checklist item title is required",
      });
    }

    const [posRows] = await db.query(
      `SELECT COALESCE(MAX(position), 0) AS maxPosition
       FROM checklist_items
       WHERE checklist_id = ?`,
      [checklistId]
    );

    const nextPosition = posRows[0].maxPosition + 1;

    const [result] = await db.query(
      `INSERT INTO checklist_items (checklist_id, title, is_completed, position)
       VALUES (?, ?, FALSE, ?)`,
      [checklistId, title, nextPosition]
    );

    return res.status(201).json({
      success: true,
      message: "Checklist item created successfully",
      itemId: result.insertId,
    });
  } catch (error) {
    console.error("Create checklist item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create checklist item",
    });
  }
};

// Toggle checklist item
export const updateChecklistItemStatus = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { is_completed } = req.body;

    await db.query(
      `UPDATE checklist_items
       SET is_completed = ?
       WHERE id = ?`,
      [is_completed, itemId]
    );

    return res.status(200).json({
      success: true,
      message: "Checklist item updated successfully",
    });
  } catch (error) {
    console.error("Update checklist item error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update checklist item",
    });
  }
};