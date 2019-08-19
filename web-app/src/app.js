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
import {I18N} from 'aurelia-i18n';
import {ConnectionManager} from './manager/connection-manager';
import {MessageManager} from './manager/message-manager';

export class App {

    static inject = [I18N, ConnectionManager, MessageManager];

    constructor(i18n, connectionManager, messageManager) {
        this.i18n = i18n;
        this.connectionManager = connectionManager;
        this.messageManager = messageManager;
    }

    configureRouter(config, router) {
        this.router = router;
        config.title = this.i18n.tr('title');
        config.map([
            {
                route: ['', 'welcome'],
                name: 'welcome',
                title: this.i18n.tr('route.welcome'),
                moduleId: 'resources/elements/panels/welcome-panel'
            },
            {
                route: ['image-manage'],
                name: 'image-manage',
                title: this.i18n.tr('route.image-manage'),
                moduleId: 'resources/elements/panels/main-panel'
            }
        ]);
    }

    activate() {
        this.connectionManager.connect();
    }

    deactivate() {
        this.connectionManager.disconnect();
        this.messageManager.dispose();
    }

}
