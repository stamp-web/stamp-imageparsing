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
