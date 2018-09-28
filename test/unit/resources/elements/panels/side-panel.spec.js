import {SidePanel} from '../../../../../src/resources/elements/panels/side-panel';

describe('side-panel', () => {

    let DEFAULT_RECT = {
        x:      20,
        y:      25,
        width:  100,
        height: 150
    };

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
});
