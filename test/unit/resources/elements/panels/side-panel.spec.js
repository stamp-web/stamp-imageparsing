import {SidePanel} from 'resources/elements/panels/side-panel';
import _ from 'lodash';

describe('side-panel', () => {

    let DEFAULT_RECT = {
        x:      20,
        y:      25,
        width:  100,
        height: 150
    };

    let DEFAULT_BOUND_REGIONS = [
        {
            name: 'Region-1',
            rectangle: DEFAULT_RECT
        },
        {
            name: 'Region-2',
            rectangle: DEFAULT_RECT
        }
    ]

    describe('isValidRegion', () => {

        it('valid', () => {
            let panel = new SidePanel();
            let region = {
                name: 'Region-1',
                filename: 'test-file.png',
                rectangle: DEFAULT_RECT
            };
            expect(panel.isValidRegion(region)).toBe(true);
        });

        it('invalid without a filename', () => {
            let panel = new SidePanel();
            let region = {
                name: 'Region-1',
                rectangle: DEFAULT_RECT
            };
            expect(panel.isValidRegion(region)).toBe(false);
        });
    });

    describe('selectedRegionChanged', () => {
        let eventAggregatorSpy;
        let panel;

        beforeEach(() => {
            eventAggregatorSpy = jasmine.createSpyObj('EventAggregator', ['publish']);
            panel = new SidePanel(eventAggregatorSpy);
            spyOn(panel, 'expand');
        });

        it('previousRegionFocusCleared', () => {
            panel.boundRegions = _.cloneDeep(DEFAULT_BOUND_REGIONS);
            panel.boundRegions[0].hasFocus = true;
            panel.selectedRegion = panel.boundRegions[1];

            panel.selectedRegionChanged();
            expect(panel.selectedRegion.hasFocus).toBe(true);
            expect(panel.boundRegions[0].hasFocus).toBe(false);
            expect(panel.expand).toHaveBeenCalledWith(panel.selectedRegion);
        });
    });
});
