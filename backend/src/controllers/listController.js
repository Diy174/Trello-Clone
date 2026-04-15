import db from "../config/db.js";

// Create list
export const createList = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "List title is required",
      });
    }

    const [posRows] = await db.query(
      `SELECT COALESCE(MAX(position), 0) AS maxPosition
       FROM lists
       WHERE board_id = ?`,
      [boardId]
    );

    const nextPosition = posRows[0].maxPosition + 1;

    const [result] = await db.query(
      `INSERT INTO lists (board_id, title, position)
       VALUES (?, ?, ?)`,
      [boardId, title, nextPosition]
    );

    return res.status(201).json({
      success: true,
      message: "List created successfully",
      listId: result.insertId,
    });
  } catch (error) {
    console.error("Create list error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create list",
    });
  }
};

// Update list
export const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "List title is required",
      });
    }

    await db.query(
      `UPDATE lists
       SET title = ?
       WHERE id = ?`,
      [title, id]
    );

    return res.status(200).json({
      success: true,
      message: "List updated successfully",
    });
  } catch (error) {
    console.error("Update list error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update list",
    });
  }
};

// Delete list
export const deleteList = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `DELETE FROM lists WHERE id = ?`,
      [id]
    );

    return res.status(200).json({
      success: true,
      message: "List deleted successfully",
    });
  } catch (error) {
    console.error("Delete list error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete list",
    });
  }
};

// Reorder lists
export const reorderLists = async (req, res) => {
  try {
    const { lists } = req.body;

    if (!Array.isArray(lists)) {
      return res.status(400).json({
        success: false,
        message: "Lists data is required",
      });
    }

    for (const list of lists) {
      await db.query(
        `UPDATE lists
         SET position = ?
         WHERE id = ?`,
        [list.position, list.id]
      );
    }

    return res.status(200).json({
      success: true,
      message: "Lists reordered successfully",
    });
  } catch (error) {
    console.error("Reorder lists error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to reorder lists",
    });
  }
};