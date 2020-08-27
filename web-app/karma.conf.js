"use strict";
const path = require('path');
const yargs = require('yargs');
const _ = require('lodash');

const project = require('./aurelia_project/aurelia.json');

let testSrc = [
    {pattern: project.unitTestRunner.source, included: false},
    'test/aurelia-karma.js'
];

let output = project.platform.output;
let appSrc = project.build.bundles.map(x => path.join(output, x.name));
let entryIndex = appSrc.indexOf(path.join(output, project.build.loader.configTarget));
let entryBundle = appSrc.splice(entryIndex, 1)[0];
let files = [
    entryBundle,
    'electron-fix.js'
].concat(testSrc).concat(appSrc);

let isWindows = /^win/.test(process.platform);

let reporters = ['progress', 'junit'];
let browsers = ['Chrome'];

let configureBrowsers = () => {
    if (isWindows) {
        //reporters.push('karma-remap-istanbul');
        browsers = ['FirefoxHeadless'];
    }
    if (yargs.argv.chrome && !_.includes(browsers, 'Chrome')) {
        browsers.push('Chrome');
    }
};

configureBrowsers();

// add coverage flag if on command line
if (yargs.argv.coverage) {
    reporters.push('coverage');
}

module.exports = function (config) {
    config.set({
        basePath:                 '',
        frameworks:               [project.testFramework.id],
        browserNoActivityTimeout: 60000,
        files:                    files,
        exclude:                  ['**/.html'],

        remapIstanbulReporter: {
            remapOptions: {},
            reports:      {
                'text-summary': null,
                html:           'coverage/html/'
            }
        },
        preprocessors:         {
            [project.unitTestRunner.source]: [project.transpiler.id],
            'src/**/*.js':                   ['coverage'],
            //'src/**/*.js': ['babel']
        },
        coverageReporter:      {
            dir:       'test/coverage',
            reporters: [
                {type: 'lcov'},
                {type: 'text-summary'}
            ]
        },


        junitReporter: {
            outputDir: 'test/junit-report/'
        },

        'babelPreprocessor': {options: project.transpiler.options},
        reporters:           reporters,
        port:                9876,
        colors:              true,
        logLevel:            config.LOG_INFO,
        autoWatch:           true,
        browsers:            browsers,
        singleRun:           true,
        client:              {
            args: ['aurelia-root', project.paths.root]
        }
    });
};
