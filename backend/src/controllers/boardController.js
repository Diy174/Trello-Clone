import db from "../config/db.js";

/*
==============================
CREATE BOARD
==============================
*/
export const createBoard = async (req, res) => {
  try {
    const { title, background } = req.body;

    if (!title || title.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Board title is required",
      });
    }

    const query = `
      INSERT INTO boards (title, background)
      VALUES (?, ?)
    `;

    const [result] = await db.query(query, [
      title,
      background || "#0079bf",
    ]);

    return res.status(201).json({
      success: true,
      message: "Board created successfully",
      boardId: result.insertId,
    });

  } catch (error) {
    console.error("Create board error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/*
==============================
GET ALL BOARDS
==============================
*/
export const getAllBoards = async (req, res) => {
  try {
    const query = `
      SELECT * FROM boards
      ORDER BY created_at DESC
    `;

    const [boards] = await db.query(query);

    return res.status(200).json({
      success: true,
      boards,
    });

  } catch (error) {
    console.error("Get all boards error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch boards",
    });
  }
};

/*
==============================
GET BOARD BY ID
==============================
*/
export const getBoardById = async (req, res) => {
  try {
    const { id } = req.params;

    const [boardRows] = await db.query(
      `SELECT * FROM boards WHERE id = ?`,
      [id]
    );

    if (boardRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Board not found",
      });
    }

    const [lists] = await db.query(
      `SELECT * FROM lists
       WHERE board_id = ?
       ORDER BY position ASC`,
      [id]
    );

    const [cards] = await db.query(
      `SELECT c.*
       FROM cards c
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = ? AND c.is_archived = FALSE
       ORDER BY c.position ASC`,
      [id]
    );

    const [labelRows] = await db.query(
      `SELECT cl.card_id, cl.label_id
       FROM card_labels cl
       JOIN cards c ON cl.card_id = c.id
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = ?`,
      [id]
    );

    const [memberRows] = await db.query(
      `SELECT cm.card_id, cm.member_id
       FROM card_members cm
       JOIN cards c ON cm.card_id = c.id
       JOIN lists l ON c.list_id = l.id
       WHERE l.board_id = ?`,
      [id]
    );

    const cardsWithMeta = cards.map((card) => {
      const labelIds = labelRows
        .filter((row) => row.card_id === card.id)
        .map((row) => row.label_id);

      const memberIds = memberRows
        .filter((row) => row.card_id === card.id)
        .map((row) => row.member_id);

      return {
        ...card,
        labelIds,
        memberIds,
      };
    });

    const listsWithCards = lists.map((list) => ({
      ...list,
      cards: cardsWithMeta.filter(
        (card) => card.list_id === list.id
      ),
    }));

    return res.status(200).json({
      success: true,
      board: boardRows[0],
      lists: listsWithCards,
    });

  } catch (error) {
    console.error("Get board by id error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};