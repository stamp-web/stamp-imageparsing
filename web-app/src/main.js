/*
 Copyright 2018 Jason Drake (jadrake75@gmail.com)

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */
import environment from './environment';
import {I18N, TCustomAttribute} from 'aurelia-i18n';
import Backend from 'i18next-xhr-backend';
import {PLATFORM, LogManager} from 'aurelia-framework';
import {ConsoleAppender} from 'aurelia-logging-console';

import 'bootstrap';

LogManager.setLevel(LogManager.logLevel.debug);

//Configure Bluebird Promises.
Promise.config({
    warnings: {
        wForgottenReturn: false
    }
});

export function configure(aurelia) {
    require(['jquery'], jquery => {
       window.jQuery = jquery;
       require(['bootstrap'], bs => {
           _initAurelia(aurelia);
       });
    });

}

function _initAurelia(aurelia) {
    aurelia.use
        .standardConfiguration()
        .plugin('aurelia-animator-css')
        .plugin(PLATFORM.moduleName('aurelia-dialog'), (configuration) => {
            configuration.useResource('attach-focus');
        })
        .plugin('aurelia-i18n', (instance) => {
            let aliases = ['t', 'i18n'];
            TCustomAttribute.configureAliases(aliases);

            instance.i18next.use(Backend);

            return instance.setup({
                backend:     {
                    loadPath: './locales/{{lng}}/{{ns}}.json',
                },
                attributes:  aliases,
                lng:         'en',
                fallbackLng: 'en',
                debug:       true
            });
        })
        .feature('resources');

    if (environment.debug) {
        aurelia.use.developmentLogging();
    }

    if (environment.testing) {
        aurelia.use.plugin('aurelia-testing');
    }

    aurelia.start().then(() => aurelia.setRoot());
}
