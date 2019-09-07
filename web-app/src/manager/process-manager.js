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
import {LogManager, inject, observable} from 'aurelia-framework';
import {remote} from 'electron';
import {IdentityHelper} from 'util/identity-helper';
import {ChannelNames, PublishAPI, StorageKeys} from 'util/constants';
import {ConnectionManager} from './connection-manager';
import _ from 'lodash';

@inject(ConnectionManager)
export class ProcessManager {

    @observable()
    running = false;

    uuid;
    serverPort;
    memoryStats = {
        freeMemory: -1,
        maxMemory: -1
    };

    constructor(connectionManager) {
        this.connectionManager = connectionManager;
        this.logger = LogManager.getLogger('process-manager');
        this._initialize();
    }

    start() {
        if (!this.running) {
            this.processHandler.start(this.uuid, this.serverPort, this._handleProcessStatus.bind(this));
        }

    }

    runningChanged() {
        if (this.running) {
            _.delay(() => {
                this.logger.debug('starting connection...');
                this.connectionManager.connect();
            }, 5000);
        } else {
            this.connectionManager.disconnect();
        }
    }

    stop() {
        if (this.pid) {
            this.processHandler.stop(this.pid);
            this.running = false;
        }
    }

    _importProcessHandler() {
        this.processHandler = remote.require('./platform/process-handler');
    }
    _initialize() {
        this._importProcessHandler();
        this.uuid = IdentityHelper.generateUUID();
        this.serverPort = 9007;
        this.logger.info('UUID for application key is ', this.uuid);
        this.connectionManager.addSubscriber(ChannelNames.MEMORY_STATS, this._handleMemoryStats.bind(this));
        _.defer(() => {
            this._getMemoryStats();
        });
    }

    _getMemoryStats() {
        this.connectionManager.send(PublishAPI.MEMORY_STATS);
        _.delay(() => {
            this._getMemoryStats();
        }, 5000);
    }

    _handleMemoryStats(response) {
        let stats = JSON.parse(_.get(response, 'body', "{}"));
        this.memoryStats.freeMemory = _.get(stats, 'freeMemory', -1);
        this.memoryStats.maxMemory = _.get(stats, 'maxMemory', -1);
        console.log(this.memoryStats);
    }

    _handleProcessStatus(status, opts) {
        switch(status) {
            case 'exit':
                this.running = false;
                break;
            case 'started':
                this.running = true;
                this.pid = opts.pid;


        }
    }
}
