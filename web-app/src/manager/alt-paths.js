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
import {StorageKeys} from "../util/constants";

export class AltPaths {

    paths = []
    loaded = false;

    constructor() {}

    load() {
        let pathData = localStorage.getItem(StorageKeys.ALTERNATE_PATHS);
        if (!_.isNil(pathData)) {
            this.paths = JSON.parse(pathData);
        }
    }

    reset() {
        localStorage.removeItem(StorageKeys.ALTERNATE_PATHS);
    }

    save() {
        localStorage.setItem(StorageKeys.ALTERNATE_PATHS, JSON.stringify(this.paths));
    }

    _ensureLoaded( ) {
        if (!this.loaded) {
            this.load();
            this.loaded = true;
        }
    }

    getPaths() {
        this._ensureLoaded();
        return this.paths;
    }

    setPaths(paths) {
        this.paths = paths;
    }

}
