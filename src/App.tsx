import { Routes, Route } from "react-router";
import Login from "./components/Login";
import Home from "./Home";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { emit } from "@tauri-apps/api/event";

async function autoUpdater() {
  const update = await check();
  if (update) {
    emit("tauri://update-request");
    toast.success("Update available");
    await update.downloadAndInstall();
    await relaunch();
  } else {
    toast.info("No update available");
  }
}

function App() {
  useEffect(() => {
    autoUpdater().catch(console.error);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/home" element={<Home />} />
    </Routes>
  );
}

export default App;
