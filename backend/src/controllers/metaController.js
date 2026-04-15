import db from "../config/db.js";

export const getAllMembers = async (req, res) => {
  try {
    const [members] = await db.query(
      "SELECT * FROM members ORDER BY id ASC"
    );

    return res.status(200).json({
      success: true,
      members,
    });
  } catch (error) {
    console.error("Get all members error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch members",
    });
  }
};

export const getBoardLabels = async (req, res) => {
  try {
    const { boardId } = req.params;

    const [labels] = await db.query(
      "SELECT * FROM labels WHERE board_id = ? ORDER BY id ASC",
      [boardId]
    );

    return res.status(200).json({
      success: true,
      labels,
    });
  } catch (error) {
    console.error("Get board labels error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch labels",
    });
  }
};