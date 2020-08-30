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


describe('WelcomePanel', () => {

    let defaultActionsCount = 0;
    let welcomepanel;

    let elementSpy = jasmine.createSpy('element');
    let i18nSpy = jasmine.createSpyObj('i18n', ['tr']);
    let routerSpy = jasmine.createSpyObj('router', ['navigate']);
    let processManagerSpy = jasmine.createSpyObj('processManager', ['start']);

    beforeEach(() => {
        welcomepanel = new WelcomePanel(elementSpy, i18nSpy, routerSpy, processManagerSpy);
        defaultActionsCount = welcomepanel.cardActions.length;

        routerSpy.navigate.calls.reset();
        processManagerSpy.start.calls.reset();
    });

    describe('activate', () => {
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

            welcomepanel.activate();
            expect(welcomepanel.cardActions.length).toBe(defaultActionsCount + 2);
            expect(welcomepanel.cardActions[0].name).toBe('image-manage');
        });
    });

    describe('handleAction', () => {
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
    });
});
