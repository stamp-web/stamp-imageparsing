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
import {StorageKeys} from "../util/constants";
import _ from "lodash";
import {HttpClient, json} from 'aurelia-fetch-client';

export class ConnectionService {

    static inject = [HttpClient];

    constructor(httpClient) {
        this.httpClient = httpClient;
    }

    _getServerURL() {
        let opts = localStorage.getItem(StorageKeys.SERVER_INFO);
        if (!_.isNil(opts)) {
            this.options = _.assign(this.options, JSON.parse(opts));
        }
        return _.get(this.options, 'server-address', 'http://localhost:9000');
    }


    isAlive() {
        return this.get('/api/svc/alive');
    }

    get(api) {
        let q = new Promise((resolve, reject) => {
            this.httpClient.fetch(this._getServerURL() + api).then(result => {
                resolve(result.json());
            }).catch(err => {
                reject(err);
            });
        });
        return q;
    }

    post(api, payload) {
        let q = new Promise((resolve, reject) => {
            this.httpClient.fetch(this._getServerURL() + api, {
                method: 'post',
                body:   JSON.stringify(payload)
            }).then(result => {
                resolve(result.json());
            }).catch(err => {
                reject(err);
            });
        });
        return q;
    }
}
