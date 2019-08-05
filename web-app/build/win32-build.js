const gulp = require('gulp');
const shell = require('gulp-shell');
const electronInstaller = require('electron-winstaller');

gulp.task('windows.build', shell.task([
        'electron-packager . "stamp-imageparsing" --overwrite --platform=win32 --arch=x64 --icon=assets/icons/win/icon.ico --overwrite --out="release-builds" --version-string.CompanyName="drakesever.com" --version-string.FileDescription=CE --version-string.ProductVersion="3.0.0" --version-string.FileVersion="0.0.0.1" --version-string.ProductName=\"Stamp Image Bursting Application\"'],
        {ignoreErrors: false})
);

gulp.task('stage.files', () => {
    return gulp.src([
        'dist/**'
    ]).pipe(gulp.dest('./release-builds/stamp-imageparsing-win32-x64/dist'));
});

gulp.task('windows.setup', gulp.series('windows.build', 'stage.files'), (done) => {


    resultPromise = electronInstaller.createWindowsInstaller({
        appDirectory: './release-builds/stamp-imageparsing-win32-x64',
        outputDirectory: './installers/win32-x64',
        authors: 'Jason Drake',
        version: '3.0.0',
        exe: 'stamp-imageparsing.exe',
        setupExe: 'setup.exe'
    });

    resultPromise.then(() => {
        console.log("It worked!");
        done();
    }).catch((e) => {
        console.log(`No dice: ${e.message}`);
        done();
    });

});