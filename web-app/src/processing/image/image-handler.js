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
import {LogManager} from "aurelia-framework";
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {ImageProcessor} from './image-processor';
import {EventNames} from 'util/constants';
import _ from 'lodash';
import {remote} from "electron";


export class ImageHandler {

    static inject = [EventAggregator, I18N, ImageProcessor];

    constructor(eventAggregator, i18n, imageProcessor) {
        this.eventAggregator = eventAggregator;
        this.i18n = i18n;
        this.imageProcessor = imageProcessor;
        this.remoteImageProcessor = remote.require('./platform/image-processing');
        this.logger = LogManager.getLogger('image-handler');
    }

    readImage(file, asBuffer = false) {
        return this.remoteImageProcessor.readImage(file, asBuffer);
    }

    /**
     * @deprecated - not currently used
     *
     * @param imageArr
     * @param options
     * @returns {string}
     */
    asObjectUrl(imageArr, options = {}) {
        let mimeType = options.mimeType;
        let blob = new Blob([Uint8Array.from(imageArr)], {type: mimeType});
        let urlCreator = window.URL || window.webkitURL || {}.createObjectURL;
        return urlCreator.createObjectURL(blob);
    }

    /**
     * @deprecated - not currently used
     *
     * @param dataURI
     * @returns {Uint8Array}
     */
    dataUrlToBinary(dataURI) {
        let encodingPrefix = "base64,";
        let base64Index = dataURI.indexOf(encodingPrefix) + encodingPrefix.length;
        let raw = window.atob(dataURI.substring(base64Index));
        let rawLength = raw.length;
        let array = new Uint8Array(new ArrayBuffer(rawLength));

        for(let i = 0; i < rawLength; i++) {
            array[i] = raw.charCodeAt(i);
        }
        return array;
    }

    asDataUrl(blob) {
        let q = new Promise((resolve, reject) => {
            let reader = new FileReader();
            reader.onload = e => {
                resolve(e.target.result);
            }
            reader.readAsDataURL(blob);
        });

        return q;
    }

    asDataUrlFromFile(filePath, filename) {
        return this.remoteImageProcessor.getDataUrlFromImage(filePath, filename);
    }

    saveRegions(data, regions, options, overwrite = false) {
        this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                message: this.i18n.tr('messages.saving-files'),
                showBusy: true
        });
        let duplicateRegions = [];
        this.remoteImageProcessor.saveImages(data, regions, options, overwrite).then(results => {
            duplicateRegions = _.map(_.filter(results, r => { return r.exists ? true: false}), 'exists');
            this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {dismiss: true});
            if(_.size(duplicateRegions) > 0) {
                this.eventAggregator.publish(EventNames.DUPLICATE_DETECTION, {duplicates: duplicateRegions});
            }
        }).catch(err => {
            this.logger.warn('Save image error', err);
            this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {dismiss: true});
        });
    }

    process(data, options, asDataURL) {
        let q = new Promise((resolve, reject) => {
            let statusCallback = (msg) => {
                this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                    message: msg ? this.i18n.tr('messages.processing-status', {status: msg}) : this.i18n.tr('messages.finished'),
                    showBusy: true,
                    dismiss: msg === null
                });
            };
            this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {message: this.i18n.tr('messages.processing'), showBusy: true});
            this.imageProcessor.process(data, options, asDataURL).then(result => {
                statusCallback(null);
                resolve({
                    boxes: result
                });
            }).catch(err => {
                reject(err);
            });
        });
        return q;
    }

    _imageToMimeType(imgType) {
        let mimeType = 'image/jpeg';
        switch(imgType) {
            case 'png':
                mimeType = 'image/png';
                break;
            case 'tiff':
                mimeType = 'image/tiff';
                break;
        }
        return mimeType;
    }

}
