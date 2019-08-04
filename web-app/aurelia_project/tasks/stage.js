import gulp from 'gulp';
import changedInPlace from "gulp-changed-in-place";
import rename from "gulp-rename";
import project from "../aurelia";

let stage = () => {
    return gulp.src([
            `scripts/**`,
            'node_modules/bootstrap/dist/**',
            'locales/**',
            'assets/**',
            'index.html'
        ], {base: './'})
        .pipe(gulp.dest(project.paths.deploy));
};

export { stage as default };
