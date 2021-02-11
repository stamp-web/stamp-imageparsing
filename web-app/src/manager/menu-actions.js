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
import {AboutDialog} from 'resources/elements/dialogs/about-dialog';
import {DialogService} from 'aurelia-dialog';
import {LogManager} from 'aurelia-framework';

export class MenuActions {

    static inject = [DialogService];

    constructor(dialogService) {
        this.dialogService = dialogService;
        this._showAboutFn = this._showAbout.bind(this);
        this._enableLoggerFn = this._enableLogger.bind(this);
    }

    getIpcRenderer() {
        return ipcRenderer;
    }

    register() {
        this.getIpcRenderer().on('menu-about', this._showAboutFn);
        this.getIpcRenderer().on('dev-tools', this._enableLoggerFn);
    }

    unregister() {
        this.getIpcRenderer().off('menu-about', this._showAboutFn);
        this.getIpcRenderer().off('dev-tools', this._enableLoggerFn);
    }

    _enableLogger() {
        LogManager.setLevel(LogManager.logLevel.debug);
    }
    _showAbout() {
        let opts = {
            viewModel: AboutDialog,
            model:     {}
        };
        this.dialogService.open(opts);
    }

}
