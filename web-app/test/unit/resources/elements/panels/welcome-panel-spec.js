/*
 Copyright 2020 Jason Drake (jadrake75@gmail.com)

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
import {WelcomePanel} from 'resources/elements/panels/welcome-panel';
import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';
import {createSpyObj} from 'jest-createspyobj';

describe('WelcomePanel', () => {

    let defaultActionsCount = 0;
    let welcomepanel;

    let element = {};
    let i18nSpy = createSpyObj('i18n', ['tr']);
    let routerSpy = createSpyObj('router', ['navigate']);
    let processManagerSpy = createSpyObj('processManager', ['start', 'checkJava']);
    let connectionManagerSpy = createSpyObj('connectionManager', ['isConnected']);
    let serverConfigSpy = createSpyObj('serverConfig', ['getJvmPath']);

    let createInstance = () => {
        welcomepanel = new WelcomePanel(element, i18nSpy, routerSpy, processManagerSpy, connectionManagerSpy, serverConfigSpy);
        defaultActionsCount = welcomepanel.cardActions.length;
    };

    describe('activate', () => {

        beforeEach(() => {
            createInstance();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('verify a valid route is inserted and welcome is ignored', () => {
            routerSpy.routes = [
                {
                    route: '',
                    name:  'welcome',
                },
                {
                    route: 'welcome',
                    name:  'welcome',
                },
                {
                    route: 'image-manage',
                    name:  'image-manage'
                }];
            welcomepanel.processManager.checkJava.mockResolvedValue(true);
            welcomepanel.activate();
            expect(welcomepanel.cardActions.length).toBe(defaultActionsCount + 1);
            expect(welcomepanel.cardActions[0].name).toBe('image-manage');
        });

        it('verify all routes are inserted', () => {
            routerSpy.routes = [
                {
                    route: 'image-manage',
                    name:  'image-manage'
                },
                {
                    route: 'manage-folders',
                    name:  'manage-folders'
                }
            ];
            welcomepanel.processManager.checkJava.mockResolvedValue(true);
            welcomepanel.activate();
            expect(welcomepanel.cardActions.length).toBe(defaultActionsCount + 2);
            expect(welcomepanel.cardActions[0].name).toBe('image-manage');
        });
    });

    describe('_checkJavaState', () => {
        beforeEach(() => {
            createInstance();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('state is false', (done) => {
            let panel = {
                disabled: true
            };
            welcomepanel.processManager.checkJava.mockResolvedValue(false);
            welcomepanel._checkJavaState(panel).then(() => {
                expect(panel.disabled).toBe(true);
                expect(welcomepanel.i18n.tr).toHaveBeenCalledWith('messages.image-processor-unavailable');
                done();
            });
        });

        it('state is true', (done) => {
            let panel = {
                disabled: true
            };
            welcomepanel.processManager.checkJava.mockResolvedValue(true);
            welcomepanel._checkJavaState(panel).then(() => {
                expect(panel.disabled).toBe(false);
                expect(welcomepanel.i18n.tr).toHaveBeenCalledWith('messages.image-processor-available');
                done();
            });


        })
    });

    describe('handleAction', () => {

        beforeEach(() => {
            createInstance();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('route action is routed', () => {
            routerSpy.routes = [
                {
                    route: 'manage-folders',
                    name:  'manage-folders'
                }
            ];

            welcomepanel.handleAction(_.first(routerSpy.routes));
            expect(routerSpy.navigate).toHaveBeenCalledWith('manage-folders');
        });

        it('image-processor is started', () => {
            let appAction = {
                name: 'start-image-processor'
            };
            welcomepanel.handleAction(appAction);
            expect(processManagerSpy.start).toHaveBeenCalled();
            expect(routerSpy.navigate).not.toHaveBeenCalled();
        });

        it('handle action short-circuits for disabled', () => {
            let appAction = {
                name:     'start-image-processor',
                disabled: true
            };
            welcomepanel.handleAction(appAction);
            expect(processManagerSpy.start).not.toHaveBeenCalled();
        });
    });

    describe('hasMessage', () => {

        beforeEach(() => {
            createInstance();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('message with errorMessage', () => {
            expect(welcomepanel.hasMessage).toBe(false);
            welcomepanel.errorMessage = 'some message';
            expect(welcomepanel.hasMessage).toBe(true);
        });

        it('message with availableMessage', () => {
            expect(welcomepanel.hasMessage).toBe(false);
            welcomepanel.availableMessage = 'some message';
            expect(welcomepanel.hasMessage).toBe(true);
        });
    });

    describe('message', () => {

        beforeEach(() => {
            createInstance();
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('message with errorMessage', () => {
            welcomepanel.errorMessage = 'some message';
            expect(welcomepanel.message).toBe('some message');
        });

        it('message with availableMessage', () => {
            welcomepanel.availableMessage = 'some available message';
            expect(welcomepanel.message).toBe('some available message');
        });
    });
});
