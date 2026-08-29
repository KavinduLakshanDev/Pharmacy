import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    title: "Unitec Pharmacy POS",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the URL from environment variable or default to local test URL
  const startUrl =
    process.env.ELECTRON_START_URL || "https://unitec-phamacy.test";

  mainWindow.loadURL(startUrl);

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  // Allow self-signed certificates for local development
  app.on(
    "certificate-error",
    (event, _webContents, url, _error, _certificate, callback) => {
      if (url.includes(".test") || url.includes("localhost")) {
        event.preventDefault();
        callback(true);
      } else {
        callback(false);
      }
    }
  );
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handler to get system printers
ipcMain.handle("get-printers", async () => {
  return await mainWindow.webContents.getPrintersAsync();
});

// IPC Handler for Printing
ipcMain.handle("print-receipt", async (_event, data) => {
  console.log("Attempting to print receipt...");
  console.log("Target Printer:", data.printerName || "Default");

  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      offscreen: true, // Use offscreen to ensure it doesn't pop up
    },
  });

  win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(data.html)}`);

  return await new Promise((resolve, reject) => {
    win.webContents.on("did-finish-load", () => {
      // Check if printer exists if a name is provided
      win.webContents
        .getPrintersAsync()
        .then((printers) => {
          const printerExists =
            !data.printerName ||
            printers.some((p) => p.name === data.printerName);

          if (data.printerName && !printerExists) {
            console.warn(
              `Printer "${data.printerName}" not found. Falling back to default.`
            );
          }

          win.webContents.print(
            {
              silent: true,
              printBackground: true,
              deviceName: printerExists ? data.printerName || "" : "",
            },
            (success, failureReason) => {
              if (success) {
                console.log("Print successful");
                resolve({ success: true });
              } else {
                console.error("Print failed:", failureReason);
                reject(failureReason);
              }
              win.destroy(); // Use destroy instead of close for offscreen/hidden windows
            }
          );
        })
        .catch((err) => {
          console.error("Failed to get printers:", err);
          reject(err);
          win.destroy();
        });
    });

    win.webContents.on(
      "did-fail-load",
      (_event, _errorCode, errorDescription) => {
        console.error("Failed to load receipt HTML:", errorDescription);
        reject(errorDescription);
        win.destroy();
      }
    );
  });
});
