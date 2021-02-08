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
import {LogManager, inject, observable} from 'aurelia-framework';
import {remote} from 'electron';
import {ChannelNames, PublishAPI} from 'util/constants';
import {ConnectionManager} from './connection-manager';
import {ServerConfig} from './server-config';

import _ from 'lodash';

@inject(ConnectionManager, ServerConfig)
export class ProcessManager {

    @observable()
    running = false;

    memoryStats = {
        freeMemory: -1,
        maxMemory: -1
    };

    constructor(connectionManager, serverConfig) {
        this.connectionManager = connectionManager;
        this.serverConfig = serverConfig;
        this.logger = LogManager.getLogger('process-manager');
        this._initialize();
    }

    checkJava(options = {}) {
        return this.processHandler.checkJava(options);
    }

    start(restart=false, options = {}) {
        if (restart) {
            this.stop();
        }
        if (!this.running) {
            let uuid = this.serverConfig.getApplicationKey();
            let serverPort = this.serverConfig.getPort();
            this.logger.info('UUID for application key is ', uuid);
            this.processHandler.start(uuid, serverPort, options, this._handleProcessStatus.bind(this));
        }
        if (!this.connectionManager.isConnected()) {
            this.connectionManager.connect();
        }
    }

    stop() {
        if (this.pid) {
            this.processHandler.stop(this.pid);
            this.running = false;
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

    _importProcessHandler() {
        this.processHandler = remote.require('./platform/process-handler');
    }

    _initialize() {
        this._importProcessHandler();
        this.connectionManager.addSubscriber(ChannelNames.MEMORY_STATS, this._handleMemoryStats.bind(this));
        _.defer(() => {
            this._getMemoryStats();
        });
    }

    _getMemoryStats() {
        if (this.connectionManager.isConnected()) {
            this.connectionManager.send(PublishAPI.MEMORY_STATS);
        }
        _.delay(() => {
            this._getMemoryStats();
        }, 5000);
    }

    _handleMemoryStats(response) {
        let stats = JSON.parse(_.get(response, 'body', "{}"));
        this.memoryStats.freeMemory = _.get(stats, 'freeMemory', -1);
        this.memoryStats.maxMemory = _.get(stats, 'maxMemory', -1);
        this.memoryStats.totalMemory = _.get(stats, 'totalMemory', -1);
        this.logger.info(this.memoryStats);
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
