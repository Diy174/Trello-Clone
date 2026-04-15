import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

function BoardsPage() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await axiosInstance.get("/boards");
      setBoards(response.data.boards || []);
    } catch (error) {
      console.error("Error fetching boards:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-semibold">
        Loading boards...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <h1 className="text-3xl font-bold text-slate-800 mb-8">Your Boards</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {boards.map((board) => (
          <div
            key={board.id}
            onClick={() => navigate(`/boards/${board.id}`)}
            className="cursor-pointer rounded-xl shadow-md p-6 text-white hover:scale-105 transition-transform duration-200"
            style={{ backgroundColor: board.background || "#0079bf" }}
          >
            <h2 className="text-xl font-bold">{board.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}

export default BoardsPage;