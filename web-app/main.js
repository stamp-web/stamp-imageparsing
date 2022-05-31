/*
 Copyright 2018 Jason Drake (jadrake75@gmail.com)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

// Modules to control application life and create native browser window
const {app, Menu, BrowserWindow, globalShortcut, ipcMain} = require('electron');

const remoteMain = require('@electron/remote/main');
const _ = require('lodash');

const electronUtililities = require('./platform/electron-utilities');
const processHandler = require('./platform/process-handler');
const fileUtilities = require('./platform/file-utilities');
const imageProcessor = require('./platform/image-processing');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// Disable for production building
process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = true;


process.on('unhandledRejection', (reason, promise) => {
    console.log('Unhandled Rejection at:', promise, 'reason:', reason);
});

function createWindow() {
    remoteMain.initialize();
    // Create the browser window.
    mainWindow = new BrowserWindow({
        backgroundColor: '#fff',
        icon:            'assets/icons/png/16x16.png',
        show:            false,
        title:           'Stamp Image Parser',
        webPreferences:  {
              contextIsolation: false,
              nodeIntegration: true
        }
    });
    remoteMain.enable(mainWindow.webContents);

    createMenu(mainWindow);
    mainWindow.maximize();
    mainWindow.loadFile('index.html')

    // Emitted when the window is closed.
    mainWindow.on('closed', function () {
        // Dereference the window object, usually you would store windows
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        mainWindow = null
    })


    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    setupProcessHandler();
    setupFileUtilities();
    setupImageProcessor();
    setupFileDialog();
};

function setupFileDialog() {
    ipcMain.handle('showFileDialog', async (event, options) => {
        const result = await electronUtililities.showFileDialog(options);
        return result;
    })
};

function setupImageProcessor() {
    ipcMain.handle('imageProcessing-readImage', (event, file, asBuffer) => {
       return imageProcessor.readImage(file, asBuffer);
    });
    ipcMain.handle('imageProcessing-getDataUrlFromImage', (event, filePath, fileName) => {
        return imageProcessor.getDataUrlFromImage(filePath, fileName);
    });
    ipcMain.handle('imageProcess-saveImages', async (event, data, regions, options, overwrite) => {
       const result = await imageProcessor.saveImages(data, regions, options, overwrite);
       return result;
    });
};

function setupFileUtilities( ) {
    ipcMain.handle('fileUtil-asFile', (event, file) => {
        return fileUtilities.asFile(file);
    });
    ipcMain.handle('fileUtil-getMimeType', async (event, file) => {
        const result = await fileUtilities.getMimeType(file);
        return result;
    });
    ipcMain.handle('fileUtil-getPathSeparator', (event) => {
       return fileUtilities.getPathSeparator();
    });
    ipcMain.handle('fileUtil-exists', (event, path) => {
        return fileUtilities.exists(path);
    });
    ipcMain.handle('fileUtil-getFolders', (event, path) => {
        return fileUtilities.getFolders(path);
    });
    ipcMain.handle('fileUtil-createFolder', (event, path) => {
        return fileUtilities.createFolder(path);
    });
};

function setupProcessHandler( ) {
    ipcMain.handle('processHandler-start', (event, uuid, serverPort, options) => {
        processHandler.start(uuid, serverPort, options, (status, opts) => {
            event.sender.send('processHandler-status', status, opts);
        });
    });
    ipcMain.handle('processHandler-stop', (event, pid) => {
       processHandler.stop(pid);
    });
    ipcMain.handle('processHandler-checkJava', (event, opts) => {
        return processHandler.checkJava(opts);
    });
};

function createMenu(win) {

    let menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    click() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'View',
            submenu: [
                {
                    label: 'Refresh',
                    accelerator: 'F5',
                    click() {
                        win.webContents.reload();
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'Technical Assistance',
                    submenu: [
                        {
                            label: 'Dev Tools',
                            accelerator: 'F12',
                            click: () => {
                                win.webContents.send('dev-tools', {});
                                win.webContents.toggleDevTools();
                            }
                        }
                    ]
                },
                {
                    type: 'separator'
                },
                {
                    label: 'About',
                    click: () => {
                        win.webContents.send('menu-about', {});
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(menu);
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
});

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
});
