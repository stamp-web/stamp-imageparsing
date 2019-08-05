/*
 Copyright 2019 Jason Drake (jadrake75@gmail.com)

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
import {observable, LogManager} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {StatusDialog} from 'resources/elements/dialogs/status-dialog';
import {EventNames, StorageKeys} from 'util/constants';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import _ from 'lodash';

const MAX_CONNECTION_TRIES = 3;

export class MessageManager {

    static inject = [DialogService, EventAggregator];

    messages = [];
    subscribers = [];
    dialogHandler;
    shown = false;
    messageData = {};

    @observable connected;

    connectionAttempts = 0;

    options = {};
    stompClient;

    constructor(dialogService, eventAggregator) {
        this.dialogService = dialogService;
        this.eventAggregator = eventAggregator;
        this.logger = LogManager.getLogger('message-manager');
        this.initialize();
    }

    initialize() {
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.STATUS_MESSAGE, this._notifyMessage.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.REMOTE_MESSAGING, this._socketConnect.bind(this)));
    }

    dispose() {
        _.forEach(this.subscribers, subscriber => {
            subscriber.dispose();
        });
    }

    _getServerURL() {
        let opts = localStorage.getItem(StorageKeys.SERVER_INFO);
        if (!_.isNil(opts)) {
            this.options = _.assign(this.options, JSON.parse(opts));
        }
        return _.get(this.options, 'server-address', 'http://localhost:9000');
    }

    _socketConnect() {
        if (this.connected) {
            return;
        }
        let socket = new SockJS(this._getServerURL() + '/api/svc/gs-guide-websocket');
        this.stompClient = Stomp.over(socket, {protocols: ['v11.stomp', 'v12.stomp']});
        this.stompClient.debug = msg => {
            this.logger.debug(msg);
        }
        _.set(this.stompClient, 'heartbeat.outgoing', 1000);
        _.set(this.stompClient, 'heartbeat.incoming', 1000);
        this.stompClient.connect({}, frame => {
            this.connected = true;
            this.connectionAttempts = 0;
        }, () => {
            this.connected = false;
            this.connectionAttempts++;
            if (this.connectionAttempts < MAX_CONNECTION_TRIES) {
                _.delay(() => {
                    this.logger.info('Attempting to reconnect message service...');
                    this._socketConnect();
                }, 1000);
            }

        });
        socket.onclose = () => {
            if (this.stompClient) {
                this.connected = false;
                try {
                    if (this.stompClient.connected) {
                        this.stompClient.disconnect();
                    }
                } finally {
                    this.connectionAttempts++;
                    if (this.connectionAttempts < MAX_CONNECTION_TRIES) {
                        _.delay(() => {
                            this._socketConnect();
                        }, 1000);
                    }
                };
            }
        }
    }

    connectedChanged() {
        if (this.stompClient && this.connected) {
            this.stompClient.subscribe('/status/status-msg', msg => {
                let data = JSON.parse(msg.body);
                if (data.status === 'STATUS') {
                    this._notifyMessage(data);
                }
            });
        }
    }

    _notifyMessage(data) {
        _.assign(this.messageData, data);
        if (data.message) {
            this.messages.push(data.message);
            if (!this.shown) {
                this.showStatus();
            }
        }
        if (data.dismiss) {
            _.delay(this.clearStatus.bind(this), 500);
        }
    }

    clearStatus( ) {
        if (this.dialogHandler) {
            this.dialogHandler.controller.cancel().then(() => {
                this.dialogHandler = undefined;
                this.shown = false;
            });
        }
    }

    showStatus() {
        this.shown = true;
        this.dialogService.open({
            viewModel: StatusDialog,
            model: this.messageData
        }).then(dialogResult => {
            this.dialogHandler = dialogResult;
            return dialogResult.closeResult;
        });
    }
}
