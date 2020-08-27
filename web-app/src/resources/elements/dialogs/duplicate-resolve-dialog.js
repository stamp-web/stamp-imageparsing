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

import _ from 'lodash';

export class DuplicateResolveDialog {

    static inject = [DialogController, ImageHandler];

    duplicates = [];

    constructor(controller, imageHandler){
        this.controller = controller;
        this.imageHandler = imageHandler;
    }

    activate(model){
        this.duplicates = _.get(model, 'duplicates'), [];
        _.forEach(this.duplicates, dup => {
           this.getImage(dup);
        });
    }

    getImage(duplicate) {
        return new Promise(resolve => {
            if(!duplicate.duplicateImage) {
                this.imageHandler.asDataUrlFromFile(duplicate.folder.path, duplicate.filePath).then(dataUrl => {
                    duplicate.duplicateImage = dataUrl;
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    getChosenDuplicates() {
        return _.filter(this.duplicates, {overwrite: true});
    }

    rotationClass(duplicate) {
        if (!duplicate.rotate) {
            return '';
        }
        return 'rotate-' + duplicate.rotate;
    }

}
