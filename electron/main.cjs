const { app, BrowserWindow } = require("electron");
const path = require("path");
const http = require("http");
const fs = require("fs");

let win;
let server;

const PORT = 5173;

function getMimeType(filePath) {
  if (filePath.endsWith(".html")) return "text/html";
  if (filePath.endsWith(".js")) return "text/javascript";
  if (filePath.endsWith(".css")) return "text/css";
  if (filePath.endsWith(".png")) return "image/png";
  if (filePath.endsWith(".jpg") || filePath.endsWith(".jpeg")) return "image/jpeg";
  if (filePath.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
}

function startLocalServer() {
  return new Promise((resolve, reject) => {
    const distPath = path.join(__dirname, "../dist");

    server = http.createServer((req, res) => {
      const requestUrl = req.url.split("?")[0];

      let filePath;

      if (
        requestUrl === "/" ||
        requestUrl === "/callback" ||
        requestUrl.endsWith(".html")
      ) {
        filePath = path.join(distPath, "index.html");
      } else {
        filePath = path.join(distPath, requestUrl);
      }

      if (!filePath.startsWith(distPath)) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
      }

      fs.readFile(filePath, (error, data) => {
        if (error) {
          res.writeHead(404);
          res.end("Not found");
          return;
        }

        res.writeHead(200, {
          "Content-Type": getMimeType(filePath),
        });

        res.end(data);
      });
    });

    server.listen(PORT, "127.0.0.1", () => {
      resolve();
    });

    server.on("error", reject);
  });
}

async function createWindow() {
  if (app.isPackaged) {
    await startLocalServer();
  }

  win = new BrowserWindow({
    width: 720,
    height: 280,
    show: true,
    center: true,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    backgroundColor: "#00000000",
    webPreferences: {
      contextIsolation: true,
    },
  });

  win.loadURL("http://127.0.0.1:5173/");

  win.on("closed", () => {
    win = null;
  });
}

app.whenReady().then(() => {
  createWindow();
});

app.on("before-quit", () => {
  if (server) {
    server.close();
  }
});