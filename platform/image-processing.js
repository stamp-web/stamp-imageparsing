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

const _ = require('lodash');

java.classpath.push('dist/stamp-imageparsing.jar');
java.classpath.push('dist/lib/ij.jar');

java.options.push('-Djava.util.logging.config.file=dist/logging.properties');

module.exports = function () {
    "use strict";

    return {

        getImageProcessor: function () {
            try {
                return java.newInstanceSync("com.drakeserver.processing.ImageProcessor");
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
            let imageProcessor = this.getImageProcessor();
            let t = (new Date()).getTime();
            let byteArray = java.newArray('byte', _.flatten(dataArray));
            console.log('time to flatten: ', (new Date().getTime() - t), 'ms');
            let javaOptions = java.newInstanceSync('java.util.Properties');
            //options.setPropertySync('minimumInterceptingArea', '0.25');

            let result = imageProcessor.processSync(byteArray, javaOptions);
            console.log(result);
            return result;
        }


    };

}();
