import db from "../config/db.js";

// Create a new list inside a board
export const createList = (req, res) => {
  try {
    const { boardId } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "List title is required",
      });
    }

    const positionQuery = `
      SELECT COALESCE(MAX(position), 0) AS maxPosition
      FROM lists
      WHERE board_id = ?
    `;

    db.query(positionQuery, [boardId], (posErr, posResults) => {
      if (posErr) {
        console.error("Error finding list position:", posErr);
        return res.status(500).json({
          success: false,
          message: "Failed to determine list position",
        });
      }

      const nextPosition = posResults[0].maxPosition + 1;

      const insertQuery = `
        INSERT INTO lists (board_id, title, position)
        VALUES (?, ?, ?)
      `;

      db.query(insertQuery, [boardId, title, nextPosition], (err, result) => {
        if (err) {
          console.error("Create list error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to create list",
          });
        }

        return res.status(201).json({
          success: false,
          message: "List created successfully",
          listId: result.insertId,
        });
      });
    });
  } catch (error) {
    console.error("Create list controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Update list title
export const updateList = (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "List title is required",
      });
    }

    const query = `
      UPDATE lists
      SET title = ?
      WHERE id = ?
    `;

    db.query(query, [title, id], (err, result) => {
      if (err) {
        console.error("Update list error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to update list",
        });
      }

      return res.status(200).json({
        success: true,
        message: "List updated successfully",
      });
    });
  } catch (error) {
    console.error("Update list controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Delete list
export const deleteList = (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      DELETE FROM lists
      WHERE id = ?
    `;

    db.query(query, [id], (err, result) => {
      if (err) {
        console.error("Delete list error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to delete list",
        });
      }

      return res.status(200).json({
        success: true,
        message: "List deleted successfully",
      });
    });
  } catch (error) {
    console.error("Delete list controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const reorderLists = (req, res) => {
  try {
    const { lists } = req.body;

    if (!Array.isArray(lists)) {
      return res.status(400).json({
        success: false,
        message: "Lists data is required",
      });
    }

    const updatePromises = lists.map((list) => {
      return new Promise((resolve, reject) => {
        const query = `
          UPDATE lists
          SET position = ?
          WHERE id = ?
        `;

        db.query(query, [list.position, list.id], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });

    Promise.all(updatePromises)
      .then(() => {
        return res.status(200).json({
          success: true,
          message: "Lists reordered successfully",
        });
      })
      .catch((err) => {
        console.error("Reorder lists error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to reorder lists",
        });
      });
  } catch (error) {
    console.error("Reorder lists controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};