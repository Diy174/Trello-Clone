import db from "../config/db.js";

// Create a new card inside a list
export const createCard = (req, res) => {
  try {
    const { listId } = req.params;
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Card title is required",
      });
    }

    const positionQuery = `
      SELECT COALESCE(MAX(position), 0) AS maxPosition
      FROM cards
      WHERE list_id = ?
    `;

    db.query(positionQuery, [listId], (posErr, posResults) => {
      if (posErr) {
        console.error("Error finding card position:", posErr);
        return res.status(500).json({
          success: false,
          message: "Failed to determine card position",
        });
      }

      const nextPosition = posResults[0].maxPosition + 1;

      const insertQuery = `
        INSERT INTO cards (list_id, title, description, position)
        VALUES (?, ?, ?, ?)
      `;

      db.query(
        insertQuery,
        [listId, title, description || "", nextPosition],
        (err, result) => {
          if (err) {
            console.error("Create card error:", err);
            return res.status(500).json({
              success: false,
              message: "Failed to create card",
            });
          }

          return res.status(201).json({
            success: true,
            message: "Card created successfully",
            cardId: result.insertId,
          });
        }
      );
    });
  } catch (error) {
    console.error("Create card controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update card title and description
export const updateCard = (req, res) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Card title is required",
      });
    }

    const query = `
      UPDATE cards
      SET title = ?, description = ?
      WHERE id = ?
    `;

    db.query(query, [title, description || "", id], (err, result) => {
      if (err) {
        console.error("Update card error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update card",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Card updated successfully",
      });
    });
  } catch (error) {
    console.error("Update card controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete card permanently
export const deleteCard = (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM cards
      WHERE id = ?
    `;

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Delete card error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete card",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Card deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete card controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Archive card
export const archiveCard = (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      UPDATE cards
      SET is_archived = TRUE
      WHERE id = ?
    `;

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Archive card error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to archive card",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Card archived successfully",
      });
    });
  } catch (error) {
    console.error("Archive card controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const reorderCards = (req, res) => {
  try {
    const { cards } = req.body;

    if (!Array.isArray(cards)) {
      return res.status(400).json({
        success: false,
        message: "Cards data is required",
      });
    }

    const updatePromises = cards.map((card) => {
      return new Promise((resolve, reject) => {
        const query = `
          UPDATE cards
          SET list_id = ?, position = ?
          WHERE id = ?
        `;

        db.query(query, [card.list_id, card.position, card.id], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    Promise.all(updatePromises)
      .then(() => {
        return res.status(200).json({
          success: true,
          message: "Cards reordered successfully",
        });
      })
      .catch((err) => {
        console.error("Reorder cards error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to reorder cards",
        });
      });
  } catch (error) {
    console.error("Reorder cards controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get full card details
export const getCardDetails = (req, res) => {
  try {
    const { id } = req.params;

    const cardQuery = `SELECT * FROM cards WHERE id = ?`;
    const labelsQuery = `
      SELECT l.*
      FROM labels l
      INNER JOIN card_labels cl ON l.id = cl.label_id
      WHERE cl.card_id = ?
    `;
    const membersQuery = `
      SELECT m.*
      FROM members m
      INNER JOIN card_members cm ON m.id = cm.member_id
      WHERE cm.card_id = ?
    `;
    const checklistsQuery = `
      SELECT * FROM checklists
      WHERE card_id = ?
      ORDER BY position ASC
    `;
    const checklistItemsQuery = `
      SELECT ci.*
      FROM checklist_items ci
      INNER JOIN checklists c ON ci.checklist_id = c.id
      WHERE c.card_id = ?
      ORDER BY ci.position ASC
    `;

    db.query(cardQuery, [id], (cardErr, cardResults) => {
      if (cardErr) {
        console.error("Get card details error:", cardErr);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch card",
        });
      }

      if (cardResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Card not found",
        });
      }

      db.query(labelsQuery, [id], (labelsErr, labelsResults) => {
        if (labelsErr) {
          console.error("Get labels error:", labelsErr);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch labels",
          });
        }

        db.query(membersQuery, [id], (membersErr, membersResults) => {
          if (membersErr) {
            console.error("Get members error:", membersErr);
            return res.status(500).json({
              success: false,
              message: "Failed to fetch members",
            });
          }

          db.query(checklistsQuery, [id], (checklistsErr, checklistsResults) => {
            if (checklistsErr) {
              console.error("Get checklists error:", checklistsErr);
              return res.status(500).json({
                success: false,
                message: "Failed to fetch checklists",
              });
            }

            db.query(checklistItemsQuery, [id], (itemsErr, itemsResults) => {
              if (itemsErr) {
                console.error("Get checklist items error:", itemsErr);
                return res.status(500).json({
                  success: false,
                  message: "Failed to fetch checklist items",
                });
              }

              const checklistsWithItems = checklistsResults.map((checklist) => ({
                ...checklist,
                items: itemsResults.filter(
                  (item) => item.checklist_id === checklist.id
                ),
              }));

              return res.status(200).json({
                success: true,
                card: cardResults[0],
                labels: labelsResults,
                members: membersResults,
                checklists: checklistsWithItems,
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error("Get card details controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update due date
export const updateCardDueDate = (req, res) => {
  try {
    const { id } = req.params;
    const { due_date } = req.body;

    const query = `
      UPDATE cards
      SET due_date = ?
      WHERE id = ?
    `;

    db.query(query, [due_date || null, id], (err) => {
      if (err) {
        console.error("Update due date error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update due date",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Due date updated successfully",
      });
    });
  } catch (error) {
    console.error("Update due date controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add label to card
export const addLabelToCard = (req, res) => {
  try {
    const { cardId, labelId } = req.params;

    const query = `
      INSERT IGNORE INTO card_labels (card_id, label_id)
      VALUES (?, ?)
    `;

    db.query(query, [cardId, labelId], (err) => {
      if (err) {
        console.error("Add label to card error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to add label to card",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Label added to card successfully",
      });
    });
  } catch (error) {
    console.error("Add label to card controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Remove label from card
export const removeLabelFromCard = (req, res) => {
  try {
    const { cardId, labelId } = req.params;

    const query = `
      DELETE FROM card_labels
      WHERE card_id = ? AND label_id = ?
    `;

    db.query(query, [cardId, labelId], (err) => {
      if (err) {
        console.error("Remove label error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to remove label",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Label removed successfully",
      });
    });
  } catch (error) {
    console.error("Remove label controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Assign member to card
export const assignMemberToCard = (req, res) => {
  try {
    const { cardId, memberId } = req.params;

    const query = `
      INSERT IGNORE INTO card_members (card_id, member_id)
      VALUES (?, ?)
    `;

    db.query(query, [cardId, memberId], (err) => {
      if (err) {
        console.error("Assign member error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to assign member",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Member assigned successfully",
      });
    });
  } catch (error) {
    console.error("Assign member controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Remove member from card
export const removeMemberFromCard = (req, res) => {
  try {
    const { cardId, memberId } = req.params;

    const query = `
      DELETE FROM card_members
      WHERE card_id = ? AND member_id = ?
    `;

    db.query(query, [cardId, memberId], (err) => {
      if (err) {
        console.error("Remove member error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to remove member",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Member removed successfully",
      });
    });
  } catch (error) {
    console.error("Remove member controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Create checklist for a card
export const createChecklist = (req, res) => {
  try {
    const { cardId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Checklist title is required",
      });
    }

    const positionQuery = `
      SELECT COALESCE(MAX(position), 0) AS maxPosition
      FROM checklists
      WHERE card_id = ?
    `;

    db.query(positionQuery, [cardId], (posErr, posResults) => {
      if (posErr) {
        console.error("Checklist position error:", posErr);
        return res.status(500).json({
          success: false,
          message: "Failed to determine checklist position",
        });
      }

      const nextPosition = posResults[0].maxPosition + 1;

      const insertQuery = `
        INSERT INTO checklists (card_id, title, position)
        VALUES (?, ?, ?)
      `;

      db.query(insertQuery, [cardId, title, nextPosition], (err, result) => {
        if (err) {
          console.error("Create checklist error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create checklist",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Checklist created successfully",
          checklistId: result.insertId,
        });
      });
    });
  } catch (error) {
    console.error("Create checklist controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Add checklist item
export const createChecklistItem = (req, res) => {
  try {
    const { checklistId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Checklist item title is required",
      });
    }

    const positionQuery = `
      SELECT COALESCE(MAX(position), 0) AS maxPosition
      FROM checklist_items
      WHERE checklist_id = ?
    `;

    db.query(positionQuery, [checklistId], (posErr, posResults) => {
      if (posErr) {
        console.error("Checklist item position error:", posErr);
        return res.status(500).json({
          success: false,
          message: "Failed to determine checklist item position",
        });
      }

      const nextPosition = posResults[0].maxPosition + 1;

      const insertQuery = `
        INSERT INTO checklist_items (checklist_id, title, is_completed, position)
        VALUES (?, ?, FALSE, ?)
      `;

      db.query(insertQuery, [checklistId, title, nextPosition], (err, result) => {
        if (err) {
          console.error("Create checklist item error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create checklist item",
          });
        }

        return res.status(201).json({
          success: true,
          message: "Checklist item created successfully",
          itemId: result.insertId,
        });
      });
    });
  } catch (error) {
    console.error("Create checklist item controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Toggle checklist item completion
export const updateChecklistItemStatus = (req, res) => {
  try {
    const { itemId } = req.params;
    const { is_completed } = req.body;

    const query = `
      UPDATE checklist_items
      SET is_completed = ?
      WHERE id = ?
    `;

    db.query(query, [is_completed, itemId], (err) => {
      if (err) {
        console.error("Update checklist item status error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update checklist item",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Checklist item updated successfully",
      });
    });
  } catch (error) {
    console.error("Update checklist item controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};