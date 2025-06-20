import { Routes, Route } from "react-router";
import Login from "./components/Login";
import Home from "./Home";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect } from "react";

async function autoUpdater() {
  const update = await check();
  if (update?.available) {
    console.log("update available");
    await update.downloadAndInstall();
    await relaunch();
  } else {
    console.log("no update available");
  }
}

function App() {
  useEffect(() => {
    autoUpdater();
  }, []);
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
