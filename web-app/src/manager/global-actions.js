/*
 Copyright 2021 Jason Drake (jadrake75@gmail.com)

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
import {remote} from 'electron';

const reload = () => {
    remote.getCurrentWindow().reload();
}

const unregister = () => {
    remote.globalShortcut.unregister('F5', reload);
    remote.globalShortcut.unregister('CommandOrControl+R', reload);
}

const unregisterWindow = () => {
    if(remote.getCurrentWindow().isVisible()) {
        unregister();
    }
}

const register = () => {
    remote.globalShortcut.register('F5', reload);
    remote.globalShortcut.register('CommandOrControl+R', reload);
}

const beforeUnload = () => {
    // we need to remove listener on window prior to unregistering globals
    remote.getCurrentWindow().removeListener('blur', unregisterWindow);
    unregister();
}

export class GlobalActions {

    constructor() {}

    register() {
        register();
        window.addEventListener('focus', register);
        window.addEventListener('blur', unregister);
        window.addEventListener('beforeunload', beforeUnload);
        remote.getCurrentWindow().on('blur', unregisterWindow);
    }

    unregister() {
        beforeUnload();
    }
}
