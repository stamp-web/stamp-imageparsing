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
const java = require('java');
const path = require('path');
const sharp = require('sharp');
const _ = require('lodash');
const fs = require('fs');


java.classpath.push('dist/stamp-imageparsing.jar');
java.classpath.push('dist/lib/ij.jar');

java.options.push('-Djava.util.logging.config.file=dist/logging.properties');

module.exports = function () {
    "use strict";

    let imageProcessor;

    let calcPixelPerMillimeter = function(dpi) {
        return dpi * 0.3937;
    }

    return {

        initialize: function() {
            this.getImageProcessor();
        },

        getImageProcessor: function () {
            if (imageProcessor) {
                return imageProcessor;
            }
            try {
                java.asyncOptions = {
                    asyncSuffix:   "",
                    syncSuffix:    "Sync",
                    promiseSuffix: "Promise",
                    promisify:     require("when/node").lift
                };
                java.import('com.drakeserver.processing.ImageProcessor');
                imageProcessor = java.newInstancePromise("com.drakeserver.processing.ImageProcessor");
                return imageProcessor;
            } catch (e) {
                throw new Error(e);
            }
        },

        /**
         * Allows for the setting of additional java options via the command processor
         *
         * eg. '-Xmx2048m'
         *
         * @param options
         */
        setJavaOptions: function (options) {
            java.options.push(options);
        },

        process: function (options, inputFile) {
            let q = new Promise((resolve, reject) => {
                let imageProcessor = this.getImageProcessor();
                let t = (new Date()).getTime();
                let javaOptions = java.newInstanceSync('java.util.Properties');
                let javaFile = java.newInstanceSync('java.io.File', inputFile);
                javaOptions.setPropertySync('padding', '' + options.boundingBox.padding);
                javaOptions.setPropertySync('minimumInterceptingArea', '' + options.boundingBox.minimumInterceptingArea);
                javaOptions.setPropertySync('minimumBoundingArea', '' + options.boundingBox.minimumBoundingArea);

                let lastMsg;
                setInterval(() => {
                    let msg = javaOptions.getPropertySync('msg');
                    if (lastMsg !== msg) {
                        console.log(msg);
                        lastMsg = msg;
                    }
                }, 150);

                imageProcessor.then(ip => {
                    ip.processPromise(javaOptions, javaFile).then(result => {
                        javaFile = null;
                        javaOptions = null;
                        ip.cleanup();
                        resolve(result);
                    });
                });

            });
            return q;
        },


        saveImages: function (data, region, options = {}) {
            let mimeType = options.mimeType || jimp.MIME_JPEG;
            let q = new Promise((resolve, reject) => {
                let img = new sharp(data).withMetadata();
                let rect = region.rectangle;
                img = img.extract({left: rect.x, top: rect.y, width: rect.width, height: rect.height});
                switch(mimeType) {
                    case 'image/tiff':
                        img = this.processTIFF(img, options);
                        break;
                    case 'image/jpeg':
                        img = this.processJPEG(img, options);
                        break;
                    case 'image/png':
                        img = this.procesPNG(img, options);
                        break;
                }
                img.toBuffer().then(buf => {
                    fs.writeFileSync(path.join((region.folder.path || __dirname), region.filePath), buf);
                    resolve();
                });

            });
            return q;
        },

        processTIFF(image, options = {}) {
            let tiffOptions = {};
            if(_.has(options, 'dpi.dpiHorizontal')) {
                _.set(tiffOptions, 'xres', +_.get(options, 'dpi.dpiHorizontal'));
            }
            if(_.has(options, 'dpi.dpiVertical')) {
                _.set(tiffOptions, 'yres', +_.get(options, 'dpi.dpiVertical'));
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
        }

    };

}();
