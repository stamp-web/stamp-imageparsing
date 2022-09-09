import gulp from 'gulp';
import project from '../aurelia.json';
import build from './build';
import {CLIOptions} from 'aurelia-cli';

function log(message) {
  console.log(message); //eslint-disable-line no-console
}

function onChange(path) {
  log(`File Changed: ${path}`);
}

function reload(done) {
  done();
}

let serve = gulp.series(
  build
);

let refresh = gulp.series(
  build,
  reload
);

let watch = function(refreshCb, onChangeCb) {
  return function(done) {
    gulp.watch(project.transpiler.source, refreshCb).on('change', onChangeCb);
    gulp.watch(project.markupProcessor.source, refreshCb).on('change', onChangeCb);
    gulp.watch(project.cssProcessor.source, refreshCb).on('change', onChangeCb);

    //see if there are static files to be watched
    if (typeof project.build.copyFiles === 'object') {
      const files = Object.keys(project.build.copyFiles);
      gulp.watch(files, refreshCb).on('change', onChangeCb);
    }
  };
};

let run;

if (CLIOptions.hasFlag('watch')) {
  run = gulp.series(
    serve,
    watch(refresh, onChange)
  );
} else {
  run = serve;
}

export { run as default, watch };
