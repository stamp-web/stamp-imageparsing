/*
 Copyright 2021 Jason Drake (jadrake75@gmail.com)

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
import {SystemSettings} from 'resources/elements/panels/system-settings';
import {IdentityHelper} from 'util/identity-helper';

import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';


describe('SystemSettings', () => {

    let settings;

    let elementSpy = jasmine.createSpy('element');
    let i18nSpy = jasmine.createSpyObj('i18n', ['tr']);
    let processManagerSpy = jasmine.createSpyObj('processManager', ['checkJava']);
    let serverConfigSpy = jasmine.createSpyObj('serverConfig', [
        'getPort', 'getHostname', 'getApplicationKey', 'getJvmPath', 'reset',
        'setPort', 'setHostname', 'setApplicationKey', 'setJvmPath', 'save']);
    let altPathsSpy = jasmine.createSpyObj('altPaths', ['getPaths', 'setPaths', 'save']);

    let createInstance = () => {
        settings = new SystemSettings(elementSpy, i18nSpy, processManagerSpy, serverConfigSpy, altPathsSpy);
    };

    describe('_checkPath', () => {
        beforeEach(() => {
            createInstance();
        });

        it('result is valid', done => {
            settings.processManager.checkJava.and.returnValue(Promise.resolve(true));
            settings.jvmValid = false;

            settings._checkPath({jvmPath: 'c:/test/some-path'}).then(() => {
               expect(settings.jvmValid).toBe(true);
               done();
            });

        });

        it('result is invalid', done => {
            settings.processManager.checkJava.and.returnValue(Promise.resolve(false));
            settings.jvmValid = false;

            settings._checkPath({jvmPath: 'some-invalid'}).then(() => {
                expect(settings.jvmValid).toBe(false);
                done();
            });

        });

    });

    describe('jvmPathChanged', () => {
        beforeEach(() => {
            createInstance();
        });

        it('value is undefined', () => {
            spyOn(settings, '_checkPath');
            settings.jvmPathChanged();
            expect(settings._checkPath).not.toHaveBeenCalled();
        });

        it('value is defined', () => {
            spyOn(settings, '_checkPath');
            settings.jvmPath = 'c:/test/path';
            settings.jvmPathChanged();
            expect(settings._checkPath).toHaveBeenCalled();
        });

    });

    describe('activate', () => {
        beforeEach(() => {
            createInstance();
        });

        it('configs are loaded', () => {
            settings.activate();
            expect(settings.serverConfig.getPort).toHaveBeenCalled();
            expect(settings.serverConfig.getHostname).toHaveBeenCalled();
            expect(settings.serverConfig.getApplicationKey).toHaveBeenCalled();
            expect(settings.serverConfig.getJvmPath).toHaveBeenCalled();
            expect(settings.altPathConfig.getPaths).toHaveBeenCalled();
        });
    });

    describe('reset', () => {
        beforeEach(() => {
            createInstance();
        });

        it('configs are reset', () => {
            spyOn(settings, 'initialize');
            settings.reset();
            expect(settings.serverConfig.reset).toHaveBeenCalled();
            expect(settings.initialize).toHaveBeenCalled();
        });
    });

    describe('save', () => {
        beforeEach(() => {
            createInstance();
        });

        it('configs are set', () => {
            settings.port = 9000;
            settings.hostname = 'test-hostname';
            settings.applicationKey = 'aaaa-bbbb';
            settings.jvmPath = 'c:/path';
            settings.save();
            expect(settings.serverConfig.setPort).toHaveBeenCalledWith(9000);
            expect(settings.serverConfig.setHostname).toHaveBeenCalledWith('test-hostname');
            expect(settings.serverConfig.setApplicationKey).toHaveBeenCalledWith('aaaa-bbbb');
            expect(settings.serverConfig.setJvmPath).toHaveBeenCalledWith('c:/path');
            expect(settings.serverConfig.save).toHaveBeenCalled();
            expect(settings.altPathConfig.save).toHaveBeenCalled();
        });
    });

    describe('generateSecurityKey', () => {
        beforeEach(() => {
            createInstance();
        });

        it('generates key', () => {
            spyOn(IdentityHelper, 'generateUUIDKey').and.returnValue('aaaa-bbbb');
            settings.generateSecurityKey();
            expect(settings.applicationKey).toBe('aaaa-bbbb')
        });
    });
});
