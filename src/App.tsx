import { Routes, Route } from "react-router";
import Login from "./components/Login";
import Home from "./Home";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
