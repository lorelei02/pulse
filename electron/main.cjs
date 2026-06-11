const { app, BrowserWindow } = require("electron");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 720,
    height: 280,
    show: true,
    frame: false,
    transparent: false,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: "#111111",
    webPreferences: {
      contextIsolation: true,
    },
  });

  win.loadURL("http://127.0.0.1:5173/");


  win.on("closed", () => {
    win = null;
  });
}

app.whenReady().then(createWindow);