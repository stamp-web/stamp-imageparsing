import {MainPanel} from 'resources/elements/panels/main-panel';
import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';


describe('WelcomePanel', () => {


    let mainpanel;

    let elementSpy = jasmine.createSpy('element');
    let i18nSpy = jasmine.createSpyObj('i18n', ['tr']);
    let routerSpy = jasmine.createSpyObj('router', ['navigate']);
    let fileManager = jasmine.createSpyObj('fileManager', ['getMimeType']);

    beforeEach(() => {
        mainpanel = new MainPanel(elementSpy, i18nSpy, routerSpy, undefined, undefined, fileManager /* Does not include others yet */);
    });

    describe('_handleMemoryStats', () => {

        beforeEach(() => {
            mainpanel.memoryStats = [];
        });

        it('first entry', () => {
            let response = {
                body: "{\"freeMemory\": 45664, \"totalMemory\": 56768}"
            };
            let percentage = 45664.0 / 56768.0;

            mainpanel._handleMemoryStats(response);
            expect(_.size(mainpanel.memoryStats)).toBe(1);
            expect(_.head(mainpanel.memoryStats)).toBeCloseTo(percentage, 2);
        });

        it('max-1 entries', () => {
            mainpanel.memoryStats = [0.0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8];

            let response = {
                body: "{\"freeMemory\": 1234, \"totalMemory\": 2345}"
            };
            let percentage = 1234.0 / 2345.0;

            mainpanel._handleMemoryStats(response);
            expect(_.size(mainpanel.memoryStats)).toBe(10);
            expect(_.last(mainpanel.memoryStats)).toBeCloseTo(percentage, 2);
        });

        it('max entries with shift', () => {
            mainpanel.memoryStats = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.95];

            let response = {
                body: "{\"freeMemory\": 678, \"totalMemory\": 700}"
            };
            let percentage = 678.0 / 700.0;

            mainpanel._handleMemoryStats(response);
            expect(_.size(mainpanel.memoryStats)).toBe(10);
            expect(_.head(mainpanel.memoryStats)).toBe(0.2);
            expect(_.last(mainpanel.memoryStats)).toBeCloseTo(percentage, 2);
        });
    });
});
