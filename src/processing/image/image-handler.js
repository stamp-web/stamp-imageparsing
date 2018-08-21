/*
 Copyright 2018 Jason Drake (jadrake75@gmail.com)

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
import {remote} from 'electron';
import {log} from '../../util/log';
import _ from 'lodash';


export class ImageHandler {

    imageProcessor = remote.require('./platform/image-processing');

    readImage(fileBlob) {
        let t = new Date().getTime();
        let q = new Promise((resolve, reject) => {
            try {
                let reader = new FileReader();
                reader.onload = () => {
                    log.info('Time to read image: ', (new Date().getTime() - t), 'ms');
                    resolve({
                        data: new Int8Array(reader.result)
                    });
                };
                reader.readAsArrayBuffer(fileBlob);
            } catch (e) {
                reject(e);
            }
        });
        return q;
    }

    asDataUrl(imageArr, options = {}) {
        let mimeType = options.mimeType || 'image/jpeg';
        let blob = new Blob([Uint8Array.from(imageArr)], {type: mimeType});
        let urlCreator = window.URL || window.webkitURL || {}.createObjectURL;
        return urlCreator.createObjectURL(blob);

    }

    extractRegion(region, options = {}) {

      //  let data = new File(imageArr);
        let q = new Promise((resolve, reject) => {

            let url = region.image.replace(/^data:image\/\w+;base64,/, '');
            let buffer = Buffer.from(url, 'base64');

            this.imageProcessor.extractRegion(region, buffer, options).then(result => {
                resolve(result);
            }).catch(err => {
                reject(err);
            });
        });
        return q;
    }

    process(dataArray, options) {
        let q = new Promise((resolve, reject) => {
            //let imageProcessor = remote.require('./platform/image-processing');
            this.imageProcessor.process(dataArray, options).then(result => {

                resolve({
                    boxes: result
                });

            }).catch(err => {
                reject(err);
            });

        });
        return q;
    }


}
