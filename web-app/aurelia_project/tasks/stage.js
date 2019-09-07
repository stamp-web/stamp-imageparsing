import gulp from 'gulp';
import project from "../aurelia";
const fs   = require('fs');

let stage = () => {
    let dir = project.paths.stage;
    if(!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
        console.log('📁 folder created:', dir);
    }
    return gulp.src([
            `../target/stamp-imageparsing-*.jar`
        ])
        .pipe(gulp.dest(dir));
};

export { stage as default };
