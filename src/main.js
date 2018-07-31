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
import {LogManager} from 'aurelia-framework';
import {ConsoleAppender} from 'aurelia-logging-console';

LogManager.addAppender(new ConsoleAppender());
LogManager.setLevel(LogManager.logLevel.debug);

//Configure Bluebird Promises.
Promise.config({
    warnings: {
        wForgottenReturn: false
    }
});

export function configure(aurelia) {
    aurelia.use
        .standardConfiguration()
        .plugin('aurelia-i18n', (instance) => {
            let aliases = ['t', 'i18n'];
            // add aliases for 't' attribute
            TCustomAttribute.configureAliases(aliases);

            // register backend plugin
            instance.i18next.use(Backend);

            // adapt options to your needs (see http://i18next.com/docs/options/)
            // make sure to return the promise of the setup method, in order to guarantee proper loading
            return instance.setup({
                backend: {                                  // <-- configure backend settings
                    loadPath: './locales/{{lng}}/{{ns}}.json', // <-- XHR settings for where to get the files from
                },
                attributes: aliases,
                lng : 'en',
                fallbackLng : 'en',
                debug : false
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
