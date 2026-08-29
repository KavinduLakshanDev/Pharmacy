# Electron Desktop Application Guide

This guide explains how the Electron desktop wrapper for the Unitec Pharmacy POS system works, how it interacts with the web application, and how to maintain it.

## 1. Overview

The Electron application is a desktop "wrapper" for the Unitec Pharmacy POS. It allows the web application to perform native system tasks—specifically **silent thermal printing**—that standard web browsers block for security reasons.

---

## 2. Architecture

The application follows the Electron standard multi-process architecture:

### A. Main Process (`electron/main.js`)
The "backend" of the desktop app. It runs in a Node.js environment and has full access to the Operating System.
- **Responsibilities**: 
  - Creating the application window.
  - Managing IPC (Inter-Process Communication) listeners.
  - Interacting with system hardware (printers).
  - Creating hidden windows for background printing.

### B. Renderer Process (React/Inertia App)
The "frontend" of the application. This is the code located in `resources/js`. It runs inside a Chromium-based browser window.
- **Security**: For safety, it has `nodeIntegration` disabled and `contextIsolation` enabled.

### C. Preload Script (`electron/preload.js`)
The "bridge" between the Main and Renderer processes. It securely exposes specific functions to the React app.
- **`window.electron`**: This object is injected into the global window of the React app.

---

## 3. Key Workflows

### Silent Thermal Printing
1. **React Trigger**: The `PosReceipt` component calls `window.electron.printReceipt(data)`.
2. **IPC Bridge**: The preload script sends an `invoke` message to the Main Process.
3. **Hidden Render**: The Main Process creates a hidden `BrowserWindow` (`show: false`) and loads the receipt HTML.
4. **Native Print**: Once loaded, it calls `win.webContents.print({ silent: true })`, bypassing the print dialog.

### Printer Management
- The app can detect system printers via `window.electron.getPrinters()`.
- Users can select a specific printer in the POS settings, which is stored in `localStorage` and passed to the print command.

---

## 4. Development & Building

### Running Locally
To start the application in development mode:
```bash
npm run electron:start
```
*This starts the Vite development server and the Electron window simultaneously.*

### Building the Installer
To generate a production `.exe` installer for Windows:
```bash
npm run electron:build
```
The installer will be generated in the `dist-electron/` directory.

---

## 5. Technical Stack
- **Electron**: v42.0.1+
- **Electron Builder**: For packaging.
- **Vite**: For bundling the React assets.
- **Inertia.js**: For server-side routing within the app.

## 6. Troubleshooting
- **Missing Printer**: If a selected printer is not found, the app defaults to the system default printer.
- **Developer Tools**: In development mode, the DevTools open automatically. In production, they are disabled.
- **SSL Certificates**: The app is configured to ignore certificate errors for `.test` and `localhost` domains during development.
