import { isTauri } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { saveAs } from "file-saver";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

/**
 * Saves an .xlsx buffer to disk.
 *
 * The Blob + <a download> trick (file-saver) is unreliable in the macOS
 * desktop build: Tauri's WKWebView doesn't handle blob downloads
 * consistently, so the saved file often loses its type and shows as
 * "unknown" in Finder. Inside Tauri we go through the native save dialog
 * and filesystem plugin instead; outside Tauri (e.g. vite dev/preview in a
 * browser) we fall back to the browser download.
 *
 * Returns false if the user cancelled the native save dialog.
 */
export async function saveExcelFile(
  buffer: ArrayBuffer | Uint8Array,
  filename: string,
): Promise<boolean> {
  const data =
    buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);

  if (isTauri()) {
    const path = await save({
      defaultPath: `${filename}.xlsx`,
      filters: [{ name: "Excel Workbook", extensions: ["xlsx"] }],
    });
    if (!path) return false;
    await writeFile(path, data);
    return true;
  }

  const blob = new Blob([data], { type: XLSX_MIME });
  saveAs(blob, `${filename}.xlsx`);
  return true;
}
