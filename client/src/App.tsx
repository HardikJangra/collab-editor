import { Routes, Route, Navigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import HomePage from "./pages/HomePage";
import EditorPage from "./pages/EditorPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/doc/:docId" element={<EditorPage />} />
      <Route
        path="/new"
        element={<Navigate to={`/doc/${uuidv4().replace(/-/g, "").slice(0, 12)}`} replace />}
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
