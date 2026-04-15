import db from "../config/db.js";

// Create a new board
export const createBoard = (req, res) => {
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

    db.query(query, [title, background || "#0079bf"], (err, result) => {
      if (err) {
        console.error("Create board error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to create board",
        });
      }

      return res.status(201).json({
        success: true,
        message: "Board created successfully",
        boardId: result.insertId,
      });
    });
  } catch (error) {
    console.error("Create board controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get all boards
export const getAllBoards = (req, res) => {
  try {
    const query = `
      SELECT * FROM boards
      ORDER BY created_at DESC
    `;

    db.query(query, (err, results) => {
      if (err) {
        console.error("Get all boards error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch boards",
        });
      }

      return res.status(200).json({
        success: true,
        boards: results,
      });
    });
  } catch (error) {
    console.error("Get all boards controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get single board with lists and cards + card labels + card members
export const getBoardById = (req, res) => {
  try {
    const { id } = req.params;

    const boardQuery = `SELECT * FROM boards WHERE id = ?`;

    const listsQuery = `
      SELECT * FROM lists
      WHERE board_id = ?
      ORDER BY position ASC
    `;

    const cardsQuery = `
      SELECT c.*
      FROM cards c
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = ? AND c.is_archived = FALSE
      ORDER BY c.position ASC
    `;

    const cardLabelsQuery = `
      SELECT cl.card_id, cl.label_id
      FROM card_labels cl
      JOIN cards c ON cl.card_id = c.id
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = ?
    `;

    const cardMembersQuery = `
      SELECT cm.card_id, cm.member_id
      FROM card_members cm
      JOIN cards c ON cm.card_id = c.id
      JOIN lists l ON c.list_id = l.id
      WHERE l.board_id = ?
    `;

    db.query(boardQuery, [id], (boardErr, boardResults) => {
      if (boardErr) {
        console.error("Get board error:", boardErr);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch board",
        });
      }

      if (boardResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Board not found",
        });
      }

      db.query(listsQuery, [id], (listsErr, listsResults) => {
        if (listsErr) {
          console.error("Get lists error:", listsErr);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch lists",
          });
        }

        db.query(cardsQuery, [id], (cardsErr, cardsResults) => {
          if (cardsErr) {
            console.error("Get cards error:", cardsErr);
            return res.status(500).json({
              success: false,
              message: "Failed to fetch cards",
            });
          }

          db.query(cardLabelsQuery, [id], (labelsErr, labelRows) => {
            if (labelsErr) {
              console.error("Get card labels error:", labelsErr);
              return res.status(500).json({
                success: false,
                message: "Failed to fetch card labels",
              });
            }

            db.query(cardMembersQuery, [id], (membersErr, memberRows) => {
              if (membersErr) {
                console.error("Get card members error:", membersErr);
                return res.status(500).json({
                  success: false,
                  message: "Failed to fetch card members",
                });
              }

              const cardsWithMeta = cardsResults.map((card) => {
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

              const listsWithCards = listsResults.map((list) => ({
                ...list,
                cards: cardsWithMeta.filter((card) => card.list_id === list.id),
              }));

              return res.status(200).json({
                success: true,
                board: boardResults[0],
                lists: listsWithCards,
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error("Get board by id controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};