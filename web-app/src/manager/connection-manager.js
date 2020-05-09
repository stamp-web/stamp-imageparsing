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
import {observable, LogManager} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {ServerConfig} from './server-config';
import {EventNames} from 'util/constants';
import {Client, Message} from '@stomp/stompjs';
import _ from 'lodash';
import SockJS from 'sockjs-client';

export class ConnectionManager {

    static inject = [EventAggregator, ServerConfig];

    listeners = [];
    stompClient;
    @observable connected;
    subscribers = {};

    constructor(eventAggregator, serverConfig) {
        this.eventAggregator = eventAggregator;
        this.serverConfig = serverConfig;
        this.logger = LogManager.getLogger('web-socket-connection');
        this._initialize();
    }

    addSubscriber(subscription, fn) {
        let sub = _.get(this.subscribers, subscription, []);
        sub.push(fn);
        _.set(this.subscribers, subscription, sub);

        if (this.connected && this.stompClient && this.stompClient.connected) {
            this.stompClient.subscribe(subscription, fn);
        }
    }

    dispose() {
        _.forEach(this.listeners, listener => {
            listener.dispose();
        });
        this.disconnect();
        this.subscribers = {};
    }

    connectedChanged() {
        if (this.stompClient) {
            if (this.connected) {
                _.forIn(this.subscribers, (callbacks, sub) => {
                    _.forEach(callbacks, cb => {
                        this.stompClient.subscribe(sub, cb);
                    })
                });

            } else {
                this.stompClient.deactivate();
                this.stompClient = undefined;
            }
        }
    }

    /**
     * Set the connected state and ensure the web socket client is closed.
     */
    disconnect() {
        this.connected = false;
        this.connectedChanged(); // ensure stompClient is disconnected
    }

    connect() {
        if (_.get(this, 'stompClient.connected')) {
            return;
        }

        this.stompClient = new Client({
            webSocketFactory: this._getSocket.bind(this),
            debug: str => {
                this.logger.debug(str);
            },
            onConnect: frame => {
                this._checkConnection(0);
            },
            onDisconnect: () => {
                this.connected = false;
            },
            onStompError: frame => {
                this.logger.error('Broker reported error: ', frame.headers['message']);
                this.logger.error('Additional details: ', frame.body);
                this.connected = false;
            },
            onWebSocketError: err => {
                this.connected = false;
            },
            onWebSocketClose: () => {
                this.disconnect();
            },
            reconnectDelay: 5000,
            heartbeatIncoming: 1000,
            heartbeatOutgoing: 1000
        });

        this.stompClient.activate();
    }


    isConnected() {
        return _.get(this, 'stompClient.connected', false);
    }

    send(channel, data) {
        if (!this.connected) {
            return;
        }
        this.stompClient.publish({destination: channel, body: data});
    }

    _checkConnection(count) {
        if (count > 10) {
            this.logger.error("Unable to establish a web-socket connection after 2500ms");
            return;
        }
        if(_.get(this,'stompClient.connected')) {
            this.connected = true;
            return;
        }
        _.delay(this._checkConnection.bind(this), 250, ++count);
    };

    _initialize() {
        this.listeners.push(this.eventAggregator.subscribe(EventNames.REMOTE_MESSAGING, this.connect.bind(this)));
    }

    _getServerURL() {
        return this.serverConfig.buildServerUrl();
    }

    _getApplicationKey() {
        return this.serverConfig.getApplicationKey();
    }

    /**
     *
     * @returns {*|SockJS}
     * @private
     */
    _getSocket() {
        let apiKey = this._getApplicationKey();
        let socket = new SockJS(this._getServerURL() + '/ws?apiKey=' + apiKey);

        if (!this.patched) {
            let that = this;
            const oldtransportClose = socket.__proto__._transportClose;
            socket.__proto__._transportClose = function (code, reason) {
                that.connected = false;
                that.connectedChanged();
                return oldtransportClose.call(this, code, reason);
            };
            that.patched = true;
        }
        return socket;
    }
}
