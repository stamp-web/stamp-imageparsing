/*
 Copyright 2020 Jason Drake (jadrake75@gmail.com)

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
import {I18N} from 'aurelia-i18n';
import {ConnectionManager} from 'manager/connection-manager';
import {MessageManager} from 'manager/message-manager';
import {ProcessManager} from 'manager/process-manager';

export class App {

    static inject = [I18N, ConnectionManager, MessageManager, ProcessManager];

    constructor(i18n, connectionManager, messageManager, processManager) {
        this.i18n = i18n;
        this.connectionManager = connectionManager;
        this.messageManager = messageManager;
        this.processManager = processManager;
    }

    configureRouter(config, router) {
        this.router = router;
        config.title = this.i18n.tr('title');
        config.map([
            {
                route: ['', 'welcome'],
                name: 'welcome',
                title: this.i18n.tr('titles.welcome'),
                label: 'titles.welcome',
                moduleId: 'resources/elements/panels/welcome-panel'
            },
            {
                route: ['image-manage'],
                name: 'image-manage',
                icon: 'assets/svg/photo.svg',
                title: this.i18n.tr('actions.open-image'),
                label: 'actions.open-image',
                moduleId: 'resources/elements/panels/main-panel'
            },
            {
                route: ['manage-folders'],
                name: 'manage-folders',
                icon: 'assets/svg/folder.svg',
                title: this.i18n.tr('actions.manage-folders'),
                label: 'actions.manage-folders',
                moduleId: 'resources/elements/panels/manage-folders'
            },
            {
                route: ['system-settings'],
                name: 'system-settings',
                icon: 'assets/svg/settings.svg',
                title: this.i18n.tr('actions.settings'),
                label: 'actions.settings',
                moduleId: 'resources/elements/panels/system-settings'
            }
        ]);
    }

    deactivate() {
        this.processManager.stop();
        this.connectionManager.disconnect();
        this.messageManager.dispose();
    }

}
