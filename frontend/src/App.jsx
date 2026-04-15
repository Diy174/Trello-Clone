import { BrowserRouter, Routes, Route } from "react-router-dom";
import BoardsPage from "./pages/BoardsPage";
import BoardPage from "./pages/BoardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<BoardsPage />} />
        <Route path="/boards/:id" element={<BoardPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;