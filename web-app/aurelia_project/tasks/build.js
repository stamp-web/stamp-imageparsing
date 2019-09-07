import gulp from 'gulp';
import {build} from 'aurelia-cli';

import transpile from './transpile';
import processMarkup from './process-markup';
import processCSS from './process-css';
import copyFiles from './copy-files';
import stage from './stage';
import project from '../aurelia.json';

export default gulp.series(
  readProjectConfiguration,
  gulp.parallel(
    stage,
    transpile,
    processMarkup,
    processCSS,
    copyFiles
  ),
  writeBundles
);

function readProjectConfiguration() {
  return build.src(project);
}

function writeBundles() {
  return build.dest();
}
