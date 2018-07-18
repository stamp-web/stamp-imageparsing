const file_system = require('fs');

console.log("HERE");

fs.copyFile('package.json', 'release-builds/stamp-imageparsing-win32-x64/package.test');
