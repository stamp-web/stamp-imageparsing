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
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {changeDpiDataUrl, changeDpiBlob} from 'changedpi';
import {ImageProcessor} from './image-processor';
import {log} from 'util/log';
import {EventNames} from 'util/constants';
import _ from 'lodash';

export class ImageHandler {

    static inject = [EventAggregator, I18N, ImageProcessor];

    constructor(eventAggregator, i18n, imageProcessor) {
        this.eventAggregator = eventAggregator;
        this.i18n = i18n;
        this.imageProcessor = imageProcessor;
    }

    readImage(fileBlob) {
        let t = new Date().getTime();
        /*let q = new Promise((resolve, reject) => {
            try {
                let reader = new FileReader();
                reader.onload = () => {
                    log.info('Time to read image: ', (new Date().getTime() - t), 'ms');
                    resolve({
                        data: reader.result //Buffer.from(reader.result)
                    });
                };
                reader.readAsArrayBuffer(fileBlob);
            } catch (e) {
                reject(e);
            }
        });*/
        let d = this.asDataUrl(fileBlob);
        return d;
        //return Promise.all([q,d]);
    }

    asObjectUrl(imageArr, options = {}) {
        let mimeType = options.mimeType || 'image/jpeg';
        let blob = new Blob([Uint8Array.from(imageArr)], {type: mimeType});
        let urlCreator = window.URL || window.webkitURL || {}.createObjectURL;
        return urlCreator.createObjectURL(blob);
    }

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

    saveRegions(imageBuffer, regions, options) {
        let opts = _.cloneDeep(options);
        _.forEach(regions, region => {
            this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                message: this.i18n.tr('messages.saving-file', {filename: region.filePath}),
                showBusy: true
            });
            opts.mimeType = region.imageType ? this._imageToMimeType(region.imageType) : options.mimeType;
            /*this.imageProcessor.saveImages(imageBuffer, region, opts,).then(() => {
                log.info("saved -> " + region.filename);
            }).catch(e => {
                log.error(e);
            });*/
            this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {dismiss: true});
        });
    }

    process(inputBytes, options) {
        let q = new Promise((resolve, reject) => {
            let statusCallback = (msg) => {
                this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                    message: msg ? this.i18n.tr('messages.processing-status', {status: msg}) : this.i18n.tr('messages.finished'),
                    showBusy: true,
                    dismiss: msg === null
                });
            };
            this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {message: this.i18n.tr('messages.processing'), showBusy: true});
            this.imageProcessor.process(inputBytes, options).then(result => {
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
