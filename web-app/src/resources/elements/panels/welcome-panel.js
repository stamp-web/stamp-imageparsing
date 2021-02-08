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
import {customElement, inject, computedFrom, bindable} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';
import {Router} from 'aurelia-router';
import {ProcessManager} from 'manager/process-manager';
import {ServerConfig} from 'manager/server-config';
import {ConnectionManager} from 'manager/connection-manager';
import {IdentityHelper} from 'util/identity-helper';

import _ from "lodash";


@customElement('welcome-panel')
@inject(Element, I18N, Router, ProcessManager, ConnectionManager, ServerConfig)
export class WelcomePanel {
    cardActions = [
        {
            name:     'start-image-processor',
            label:    'actions.start-processor',
            icon:     'assets/svg/process.svg',
            disabled: true
        }
    ];

    constructor(element, i18n, router, processManager, connectionManager, serverConfig) {
        this.element = element;
        this.i18n = i18n;
        this.router = router;
        this.processManager = processManager;
        this.connectionManager = connectionManager;
        this.serverConfig = serverConfig;
    }

    activate() {
        let routes = _.get(this.router, 'routes');
        if (_.size(routes) > 0) {
            _.forEachRight(routes, r => {
               let route = _.get(r, 'route');
               if (route !== 'welcome' && !_.isEmpty(route)) {
                   this.cardActions.unshift(r);
               }
            });
        }
        let ip = _.find(this.cardActions, {name: 'start-image-processor'});
        if (ip) {
            this._checkJavaState(ip);
        }
        this._startPing();
    }

    _checkJavaState(panel) {
        let opts = {
            jvmPath: this.serverConfig.getJvmPath()
        };
        return this.processManager.checkJava(opts).then(valid => {
            if (valid) {
                panel.disabled = false;
                this.availableMessage = this.i18n.tr('messages.image-processor-available');
            } else {
                this.errorMessage = this.i18n.tr('messages.image-processor-unavailable');
            }
        });
    }

    _startPing() {
        let f = () => {
            this.connected = this.connectionManager.isConnected();
            _.delay(f, 2000);
        }
        f();
    }

    @computedFrom('errorMessage', 'availableMessage')
    get hasMessage() {
        return !_.isUndefined(this.errorMessage || this.availableMessage);
    }

    @computedFrom('errorMessage', 'availableMessage')
    get message() {
        return this.availableMessage ? this.availableMessage : this.errorMessage;
    }

    handleAction(action) {
        if (action.disabled) {
            return;
        }
        if (action.route) {
            this.router.navigate(action.route);
            return;
        }
        switch(action.name) {
            case 'start-image-processor':
                this.processManager.start(true);
                break;
        }
    }

}
