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
import {DialogController} from 'aurelia-dialog';
import {observable} from 'aurelia-framework';
import {ImageHandler} from "../../../processing/image/image-handler";
import {FileManager} from "../../../manager/file-manager";

import _ from 'lodash';

export class DuplicateResolveDialog {

    static inject = [DialogController, ImageHandler, FileManager];

    duplicates = [];

    constructor(controller, imageHandler, fileManager){
        this.controller = controller;
        this.imageHandler = imageHandler;
        this.fileManager = fileManager;
    }

    activate(model){
        this.duplicates = _.get(model, 'duplicates'), [];
        _.forEach(this.duplicates, dup => {
           this.getImage(dup);
        });
    }

    getImage(duplicate) {
        return new Promise(resolve => {
            let path = [duplicate.folder.path];
            if (duplicate.altPath) {
                path.push(duplicate.altPath);
            }
            let fullPath = path.join(this.fileManager.getPathSeparator());
            this.imageHandler.asDataUrlFromFile(fullPath, duplicate.filePath).then(dataUrl => {
                duplicate.duplicateImage = dataUrl;
                resolve();
            });
        });
    }

    getChosenDuplicates() {
        return _.filter(this.duplicates, {overwrite: true});
    }

    showAltPath(duplicate) {
        return (duplicate.altPath) ? '(' + duplicate.altPath + ')' : '';
    }

    rotationClass(duplicate) {
        if (!duplicate.rotate) {
            return '';
        }
        return 'rotate-' + duplicate.rotate;
    }

}
