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

const path = require('path');
const sharp = require('sharp');
const _ = require('lodash');
const fs = require('fs');
const mime = require('mime/lite');
const FileReader = require('filereader');
const fileUtilities = require('./file-utilities');

module.exports = function () {
    "use strict";

    let calcPixelPerMillimeter = function(dpi) {
        return dpi * 0.3937;
    }

    return {
        getDataUrlFromImage: function(folderPath, filename) {
            let fullPath = path.join((folderPath || __dirname), filename);
            return new Promise((resolve, reject) => {
                let img = new sharp(fullPath, {failOnError: false});
                img.png().toBuffer().then(buf => {
                    resolve('data:' + mime.getType('png') + ';base64,' + buf.toString('base64'));
                }).catch(err => {
                    reject(err);
                });
            });
        },

        saveImages: function(data, regions, options = {}, overwrite = false) {
            let duplicates = [];
            let savePromises = [];
            _.forEach(regions, region => {
                let opts = _.cloneDeep(options);
                opts.mimeType = fileUtilities.getMimeType(region.imageType);
                savePromises.push(this._saveImage(data, region, opts, overwrite));
            });
            return Promise.all(savePromises);
        },

        _saveImage: function (data, region, options = {}, overwrite = false) {
            let mimeType = options.mimeType;
            return new Promise((resolve, reject) => {
                let img = new sharp(data, {failOnError: false}).withMetadata();
                let rect = region.rectangle;
                img = img.extract({left: rect.x, top: rect.y, width: rect.width, height: rect.height});
                if( region.rotate) {
                    img = img.rotate(region.rotate);
                }
                switch(mimeType) {
                    case mime.getType('tiff'):
                        img = this.processTIFF(img, options);
                        break;
                    case mime.getType('jpeg'):
                        img = this.processJPEG(img, options);
                        break;
                    case mime.getType('png'):
                        img = this.procesPNG(img, options);
                        break;
                }
                img.toBuffer().then(buf => {
                    let basePath = (_.get(region, 'folder.path') || __dirname);
                    let fullPath = region.altPath ? path.join(basePath, region.altPath) : basePath;
                    let filename = path.join(fullPath, region.filePath);
                    _.set(region, 'saved', false);
                    if(!fs.existsSync(filename) || overwrite) {
                        fs.mkdirSync(fullPath, {recursive: true});
                        fs.writeFileSync(filename, buf);
                        _.unset(region, 'exists');
                        _.set(region, 'saved', true);
                    } else {
                        _.set(region, 'exists', true);
                    }
                    resolve(region);
                }).catch(err => {
                    console.log('_saveImage error', err);
                    reject({});
                });
            });
        },

        _dpiToPixelDensity(val) {
            return val / 2.54;
        },

        processTIFF(image, options = {}) {
            let tiffOptions = {};
            let compression = _.get(options, 'tiff.compression', 'jpeg');
            _.set(tiffOptions, 'compression', compression);
            if (compression === 'jpeg') {
                _.set(tiffOptions, 'quality', _.get(options, 'jpeg.quality', 85));
            }
            if(_.has(options, 'dpi.horizontal')) {
                _.set(tiffOptions, 'xres', this._dpiToPixelDensity(+_.get(options, 'dpi.horizontal', 300)));
            }
            if(_.has(options, 'dpi.vertical')) {
                _.set(tiffOptions, 'yres', this._dpiToPixelDensity(+_.get(options, 'dpi.vertical', 300)));
            }
            return image.tiff(tiffOptions);
        },

        processJPEG(image, options = {}) {
            let jpegOptions = {};
            _.set(jpegOptions, 'quality', +_.get(options, 'jpeg.quality', 85));
            return image.jpeg(jpegOptions);
        },

        procesPNG(image, options = {}) {
            return image.png();
        },

        readImage(file, asBuffer = false) {
            let t = new Date().getTime();

            if (asBuffer) {
                return new Promise((resolve, reject) => {
                    try {
                        let reader = new FileReader();
                        reader.onload = () => {
                            console.log('Time to read image: ', (new Date().getTime() - t), 'ms');
                            resolve({
                                data: Buffer.from(reader.result)
                            });
                        };
                        reader.readAsArrayBuffer(file);
                    } catch (e) {
                        reject(e);
                    }
                });
            } else {
                return new Promise(resolve => {
                    let reader = new FileReader();
                    reader.onload = e => {
                        resolve(e.target.result);
                    }
                    reader.readAsDataURL(file);
                });
            }
        }

    };

}();
