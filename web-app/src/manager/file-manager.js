/*
 Copyright 2022 Jason Drake (jadrake75@gmail.com)

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
import {ipcRenderer} from "electron";


export class FileManager {

    constructor() {
    }

    /**
     * Returns an array of folder information at a given path.  The results are {name|path}
     * @param path
     * @returns {*|Array}
     */
    getFolders(path) {
        return ipcRenderer.invoke('fileUtil-getFolders', path);
    }

    /**
     * Will create a folder given the parent path and the path name.
     *
     * @param parent - the parent path name
     * @param path - the path to create under the parent
     *
     * @return promise of the create folder operation
     */
    createFolder(parent, path) {
        return this.getPathSeparator().then(sep => {
            let totalPath = [parent, path].join(sep);
            return ipcRenderer.invoke('fileUtil-createFolder', totalPath);
        })

    }

    /**
     * Determine if the path exists.
     *
     * @param path
     * @returns {*}
     */
    exists(path) {
        return ipcRenderer.invoke('fileUtil-exists');
    }

    /**
     * Retrieve the platform path separator
     *
     * @returns {"\" | "/"}
     */
    getPathSeparator() {
        return ipcRenderer.invoke('fileUtil-getPathSeparator');
    }

    getMimeType(path) {
       return ipcRenderer.invoke('fileUtil-getMimeType', path);

    }

    asFile(path) {
        return ipcRenderer.invoke('fileUtil-asFile', path);
    }
}
