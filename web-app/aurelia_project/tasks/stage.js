import gulp from 'gulp';
import project from '../aurelia.json';
const fs   = require('fs');

let stage = () => {
    console.log('Copying library files from Java Project');
    fs.copyFileSync(`../target/${project.paths.libFile}`, `${project.paths.stage}/${project.paths.libFile}`);
    return Promise.resolve();
};

export { stage as default };
