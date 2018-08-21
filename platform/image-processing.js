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
const jimp = require('jimp');
const _ = require('lodash');

java.classpath.push('dist/stamp-imageparsing.jar');
java.classpath.push('dist/lib/ij.jar');

java.options.push('-Djava.util.logging.config.file=dist/logging.properties');

module.exports = function () {
    "use strict";

    let imageProcessor;

    return {

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

        process: function (dataArray, options) {
            let q = new Promise((resolve, reject) => {
                let imageProcessor = this.getImageProcessor();
                let t = (new Date()).getTime();
                let byteArray = java.newArray('byte', _.flatten(dataArray));
                console.log('time to flatten: ', (new Date().getTime() - t), 'ms');
                let javaOptions = java.newInstanceSync('java.util.Properties');
                // javaOptions.setPropertySync('minimumInterceptingArea', '0.25');

                let lastMsg;
                setInterval(() => {
                    let msg = javaOptions.getPropertySync('msg');
                    if (lastMsg !== msg) {
                        console.log(msg);
                        lastMsg = msg;
                    }
                }, 150);

                imageProcessor.then(ip => {
                    ip.processPromise(byteArray, javaOptions).then(result => {
                        resolve(result);
                    });
                });

            });
            return q;
        },

        extractRegion: function(region, buffer, options) {
            console.log("ok here we go", region);
            let q = new Promise((resolve,reject) => {



                jimp.read(buffer).then(img => {
                    console.log(img);
                    resolve('tada');
                }).catch(function(err) {
                    console.error(err);
                });

                /*var fileReader = new FileReader();
                fileReader.onload = function(event) {
                    let arrayBuffer = event.target.result;
                    jimp.read(arrayBuffer).then(img => {
                        console.log("got image");
                        img.crop(region.x, region.y, region.w, region.h);
                        resolve(img);
                    }).catch(err => {
                        console.log(err);
                        reject(err);
                    });
                };
                fileReader.readAsArrayBuffer(image);*/


            });
            return q;

        }


    };

}();
