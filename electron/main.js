const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { fork } = require("child_process");

let mainWindow;
let serverProcess;

const DATA_PATH = path.join(app.getPath("userData"), "yarn-store.json");
const UPLOADS_PATH = path.join(app.getPath("userData"), "uploads");

function startServer() {
  const serverPath = path.join(__dirname, "..", "server", "standalone.js");
  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      PORT: "3000",
      YARN_DATA_PATH: DATA_PATH,
      YARN_UPLOADS_PATH: UPLOADS_PATH,
    },
    stdio: "pipe",
  });
  serverProcess.stdout?.on("data", (d) => console.log(d.toString()));
  serverProcess.stderr?.on("data", (d) => console.error(d.toString()));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadURL("http://localhost:3000");
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  const fs = require("fs");
  if (!fs.existsSync(UPLOADS_PATH)) {
    fs.mkdirSync(UPLOADS_PATH, { recursive: true });
  }
  startServer();
  setTimeout(createWindow, 2000);
});

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) createWindow();
});

ipcMain.handle("get-data-path", () => DATA_PATH);
ipcMain.handle("get-uploads-path", () => UPLOADS_PATH);