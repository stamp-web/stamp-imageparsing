/*
 Copyright 2022 Jason Drake (jadrake75@gmail.com)

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
import {remote} from '@electron/remote';

const reload = () => {
    window.BrowserWindow.getCurrentWindow().reload();
}

const unregister = () => {
    window.BrowserWindow.globalShortcut.unregister('F5', reload);
    window.BrowserWindow.globalShortcut.unregister('CommandOrControl+R', reload);
}

const unregisterWindow = () => {
    if(window.BrowserWindow.getCurrentWindow().isVisible()) {
        unregister();
    }
}

const register = () => {
    window.BrowserWindow.globalShortcut.register('F5', reload);
    window.BrowserWindow.globalShortcut.register('CommandOrControl+R', reload);
}

const beforeUnload = () => {
    // we need to remove listener on window prior to unregistering globals
    window.BrowserWindow.getCurrentWindow().removeListener('blur', unregisterWindow);
    unregister();
}

export class GlobalActions {

    constructor() {}

    register() {
        register();
        window.addEventListener('focus', register);
        window.addEventListener('blur', unregister);
        window.addEventListener('beforeunload', beforeUnload);
        window.BrowserWindow.getCurrentWindow().on('blur', unregisterWindow);
    }

    unregister() {
        beforeUnload();
    }
}
