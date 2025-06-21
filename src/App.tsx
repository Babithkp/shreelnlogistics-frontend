import { Routes, Route } from "react-router";
import Login from "./components/Login";
import Home from "./Home";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
// import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect } from "react";
import { toast } from "react-toastify";

// Add this at top or in a types.d.ts file:
declare global {
  interface Window {
    __TAURI__?: any;
  }
}

async function autoUpdater() {
  const update = await check();
  if (update?.available) {
    toast.success("Update available");
    await update.downloadAndInstall();
    await relaunch();
  } else {
    toast.info("No update available");
  }
}

// function isTauri() {
//   return !!window.__TAURI__;
// }

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
