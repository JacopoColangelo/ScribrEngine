const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        },
        icon: path.join(__dirname, 'public', 'favicon.ico'),
        title: 'ScribrEngine'
    });

    const distIndex = path.join(__dirname, 'dist', 'index.html');
    if (app.isPackaged || fs.existsSync(distIndex)) {
        mainWindow.loadFile(distIndex);
    } else {
        mainWindow.loadURL('http://localhost:5173');
    }

    // Remove menu bar for cleaner look
    mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
