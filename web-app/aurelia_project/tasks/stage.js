import gulp from 'gulp';
import project from "../aurelia";
const fs   = require('fs');

let stage = () => {
    console.log('Copying library files from Java Project')
    fs.copyFileSync(`../target/${project.paths.libFile}`, `${project.paths.stage}/${project.paths.libFile}`);
};

export { stage as default };
