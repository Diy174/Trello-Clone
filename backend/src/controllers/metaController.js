import db from "../config/db.js";

export const getAllMembers = (req, res) => {
  try {
    db.query("SELECT * FROM members ORDER BY id ASC", (err, results) => {
      if (err) {
        console.error("Get members error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch members",
        });
      }

      return res.status(200).json({
        success: true,
        members: results,
      });
    });
  } catch (error) {
    console.error("Get members controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getBoardLabels = (req, res) => {
  try {
    const { boardId } = req.params;

    db.query(
      "SELECT * FROM labels WHERE board_id = ? ORDER BY id ASC",
      [boardId],
      (err, results) => {
        if (err) {
          console.error("Get board labels error:", err);
          return res.status(500).json({
            success: false,
            message: "Failed to fetch labels",
          });
        }

        return res.status(200).json({
          success: true,
          labels: results,
        });
      }
    );
  } catch (error) {
    console.error("Get board labels controller error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};