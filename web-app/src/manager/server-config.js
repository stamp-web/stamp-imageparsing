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

import _ from "lodash";
import {IdentityHelper} from "../util/identity-helper";
import {ServerConfiguration, StorageKeys} from "../util/constants";

export class ServerConfig {

    serverInfo = {}
    loaded = false;

    load() {
        let serverData = localStorage.getItem(StorageKeys.SERVER_INFO);
        if (!_.isNil(serverData)) {
            this.serverInfo = JSON.parse(serverData);
        }
    }

    reset() {
        localStorage.removeItem(StorageKeys.SERVER_INFO);
    }

    save() {
        localStorage.setItem(StorageKeys.SERVER_INFO, JSON.stringify(this.serverInfo));
    }

    _ensureLoaded( ) {
        if (!this.loaded) {
            this.load();
            this.loaded = true;
        }
    }

    buildServerUrl() {
        this._ensureLoaded();
        return `${this.getScheme()}://${this.getHostname()}:${this.getPort()}`;
    }

    getApplicationKey() {
        this._ensureLoaded();
        return _.get(this.serverInfo, 'application-key', IdentityHelper.generateUUIDKey());
    }

    setApplicationKey(applicationKey) {
        _.set(this.serverInfo, 'application-key', applicationKey);
    }

    getPort() {
        this._ensureLoaded();
        return _.get(this.serverInfo, 'serverPort', ServerConfiguration.serverPort);
    }

    setPort(port) {
        _.set(this.serverInfo, 'serverPort', port);
    }

    getHostname() {
        this._ensureLoaded();
        return _.get(this.serverInfo, 'hostname', ServerConfiguration.hostname);
    }

    setHostname(hostname) {
        _.set(this.serverInfo, 'hostname', hostname);
    }

    getScheme() {
        this._ensureLoaded();
        return _.get(this.serverInfo, 'scheme', ServerConfiguration.scheme);
    }

    setScheme(scheme) {
        _.set(this.serverInfo, 'scheme', scheme);
    }

    getJvmPath() {
        this._ensureLoaded();
        return _.get(this.serverInfo, 'jvmPath', ServerConfiguration.jvmPath);
    }

    setJvmPath(path) {
        _.set(this.serverInfo, 'jvmPath', path);
    }

}
