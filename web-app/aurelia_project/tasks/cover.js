import {Server as Karma} from 'karma';
import {CLIOptions} from 'aurelia-cli';
import project from "../aurelia.json";

export function cover(done) {
    new Karma({
        configFile: __dirname + '/../../karma.conf.js',
        frameworks: [project.testFramework.id, 'requirejs'],
        files: [
            {pattern: 'src\\**\\*.js', included: true},
            {pattern: 'test\\unit\\**\\*.js', included: false},
            // This file actually loads the spec files via require - it's based on aurelia-karma.js
            // but removes setup.js and its dependencies
            'test/aurelia-karma-cover.js'
        ],
        exclude: [
            'src/environment.js',
            'src/main.js',
            'src/resources/index.js'
        ],
        preprocessors: {
            'src/**/*.js': ['babel'],
        },
        reporters: ['progress', 'coverage'],
        singleRun: !CLIOptions.hasFlag('watch'),
        coverageReporter: {
            includeAllSources: true,
            reporters: [
                {type: 'html', dir: 'coverage'},
                {type: 'text'}
            ]
        }
    }, done).start();
}

export default cover;
