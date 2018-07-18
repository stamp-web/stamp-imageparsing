const java = require('java');
const path = require('path');

java.classpath.push('./dist/stamp-imageparsing.jar');
java.classpath.push('./dist/lib/ij.jar');
java.options.push('-Xmx2048m');


var imageProcessor = java.newInstanceSync("com.drakeserver.processing.ImageProcessor");

module.exports = () => {

    return {
        process: () => {
            let result = imageProcessor.processSync();
            return result;
        }
    }

};
