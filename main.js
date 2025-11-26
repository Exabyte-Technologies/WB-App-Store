const { app, BrowserWindow, ipcMain } = require('electron');
const { Notification } = require('electron');
const { net } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const resourcesPath = __dirname.replace(/app\.asar$/, '');
const scriptPath = path.join(resourcesPath, 'extraResources', 'mas');

var installedApps = []
var currentlyInstallingApp = ''
var currentlyUninstallingApp = ''

let mainWindow;

function showNotification(title, body) {
  const myNotification = new Notification({
    title: title,
    body: body
  });
  myNotification.show();
}

async function runCommandAndWait(command) {
  try {
    const { stdout, stderr } = await exec(command);
    return { stdout, stderr, success: true };
  } catch (error) {
    return { 
      stdout: error.stdout || '', 
      stderr: error.stderr || error.message, 
      success: false,
      error: error
    };
  }
}

async function sendInstalledApps() {
    var rawAppList = await runCommandAndWait(`'${scriptPath}' list`)
    var appList = rawAppList.stdout
    var formattedAppList = appList
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => {
            const match = line.match(/^\d+/);
            return match ? match[0] : null;
        })
        .filter(appId => appId !== null)
    installedApps = formattedAppList
    mainWindow.webContents.send('installedList',  formattedAppList)
}

function extractAppId(url) {
    const parts = url.split('/id');
    return parts[1]?.split('?')[0] || null;
}

function removeAppIds(input) {
    var updateText = input.split('\n')
        .map(line => line.replace(/^\d+\s/, ''))
        .join('\n-\n');
    if (updateText == '' || updateText == '\n' || updateText == undefined) {
        return ''
    }
    return updateText
}

function notifyAppInstalling() {
    mainWindow.webContents.send('main-message', 'app-installing');
}

function notifyAppUninstalling() {
    mainWindow.webContents.send('main-message', 'app-uninstalling');
}

async function installMacApp(appId) {
    currentlyInstallingApp = appId
    notifyAppInstalling()
    await runCommandAndWait(`'${scriptPath}' purchase ${appId}`);
    currentlyInstallingApp = ''
    mainWindow.webContents.send('main-message', 'app-installed');
}

async function uninstallMacApp(appId) {
    currentlyUninstallingApp = appId
    notifyAppUninstalling()
    var command = `sudo '${scriptPath}' uninstall ${appId}`
    await runCommandAndWait(`osascript -e "do shell script \\"${command}\\" with administrator privileges"`);
    currentlyUninstallingApp = ''
    mainWindow.webContents.send('main-message', 'app-uninstalled');
}

async function upgradeAllApps() {
    await runCommandAndWait(`'${scriptPath}' upgrade`)
    sendUpgradeComplete()
}

async function sendOutdatedApps() {
    var rawAppList = await runCommandAndWait(`'${scriptPath}' outdated`)
    var appList = rawAppList.stdout
    var formattedAppList = removeAppIds(appList)
    if (formattedAppList == '') {
        formattedAppList = 'No updates available'
    }
    mainWindow.webContents.send('outdated-app',  formattedAppList)
}

async function sendUpgradeComplete() {
    mainWindow.webContents.send('main-message', 'upgrade-complete');
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 950,
        preload: path.join(__dirname, 'preload.js'),
        frame: false,
        titleBarStyle: 'hidden',
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
            preload: path.join(__dirname, 'preload.js')
        }
    });

    //determine is app is installed by app-id
    function isAppInstalled(appId) {
        return installedApps.includes(appId);
    }

      // 1. Prevent navigation away from the initial page
  mainWindow.webContents.on('will-navigate', (event, navigationUrl) => {
    if (navigationUrl.startsWith('macappstore')) {
        if (isAppInstalled(extractAppId(navigationUrl))) {
            uninstallMacApp(extractAppId(navigationUrl));
            event.preventDefault();
        } else {
            installMacApp(extractAppId(navigationUrl));
            event.preventDefault();
        }
    }
  });

    // Load a website (you can change this URL)
    mainWindow.loadURL('https://apps.apple.com/mac/');
    
    // Inject JavaScript after page loads
    mainWindow.webContents.on('did-finish-load', async () => {
        setInterval(async () => {await injectJavaScriptFromFile();}, 750)
    });

    mainWindow.on('closed', () => {
        app.quit()
    })

    // Open DevTools for debugging (optional)
    // mainWindow.webContents.openDevTools();
}

// Read and inject JavaScript from external file
async function injectJavaScriptFromFile() {
    try {
        // Read the injection code from the external file
        const injectionCode = await fs.readFile(
            path.join(__dirname, 'injection.js'), 
            'utf8'
        );
        
        // Execute the JavaScript in the page context
        const result = await mainWindow.webContents.executeJavaScript(injectionCode);
    } catch (error) {
    }
}

function sendCurrentlyModifyingApp() {
    mainWindow.webContents.send('currently-modifying-app', [currentlyInstallingApp, currentlyUninstallingApp])
}

async function sendInstalledAppsText() {
    var rawAppList = await runCommandAndWait(`'${scriptPath}' list`)
    var appList = rawAppList.stdout
    var formattedAppList = removeAppIds(appList)
    if (formattedAppList == '') {
        formattedAppList = 'No apps installed'
    }
    mainWindow.webContents.send('installedDisplay', formattedAppList);
}

app.whenReady().then(async () => {
    createWindow()

    ipcMain.on('message-to-main', (event, message) => {
        switch (message) {
            case 'get-outdated':
                sendOutdatedApps()
                break;
            case 'upgrade-outdated':
                upgradeAllApps()
                break;
            case 'getInstalledAppsText':
                sendInstalledAppsText()
                break;
        }
  });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
        app.clearCache();
        mainWindow.webContents.send('main-message', 'first-launch');
        localStorage.clear()
        const win = BrowserWindow.getAllWindows()[0];
        const ses = win.webContents.session;
        ses.clearCache(() => {
          alert("Cache cleared!");
        });
        setTimeout(() => {
            mainWindow.webContents.send('main-message', 'first-launch');
        }, 5000)
    }
});

setInterval(() => {
    sendInstalledApps();
    sendCurrentlyModifyingApp();
}, 1000);