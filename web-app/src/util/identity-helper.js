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
import uuid from 'uuid/v1';
import {StorageKeys} from './constants';
import _ from 'lodash';

export class IdentityHelper {

    static generateUUID(forceNewKey = false) {

        let opts = sessionStorage.getItem(StorageKeys.SERVER_INFO);
        let options = !_.isNil(opts) ? _.assign(this.options, JSON.parse(opts)) : {};
        let id = _.get(options, 'application-key', uuid());
        id = (forceNewKey || !id) ? uuid() : id;
        _.set(options, 'application-key', id);
        sessionStorage.setItem(StorageKeys.SERVER_INFO, JSON.stringify(options));
        return id;
    }
}
