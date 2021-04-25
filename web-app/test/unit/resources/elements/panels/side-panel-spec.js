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

import {SidePanel} from "resources/elements/panels/side-panel";

describe('SidePanel', () => {

    let defaultActionsCount = 0;
    let sidepanel;

    let eventAggregatorSpy = jasmine.createSpy('eventAggregator');
    let bindingEngineSpy = jasmine.createSpy('bindingEngine');
    let dialogServiceSpy = jasmine.createSpy('dialogServiceSpy');

    beforeEach(() => {
        sidepanel = new SidePanel(eventAggregatorSpy, bindingEngineSpy, dialogServiceSpy);
    });

    describe('filteredRegions', () => {
        beforeEach(() => {
            sidepanel.boundRegions = [
                {name: 'Region-1'},
                {name: 'Region-2'},
                {name: 'Region-3'}
            ];
        });

        it('non-filtered returns full list', () => {
            let list = sidepanel.filteredRegions;
            expect(list.length).toBe(3);
            expect(sidepanel.selectedRegion).toBe(sidepanel.boundRegions[0]);
        });

        it('filtered with a saved region', () => {
            sidepanel.boundRegions[1].saved = true;
            sidepanel.selectedRegion = sidepanel.boundRegions[1];
            sidepanel.toggled = true;
            let list = sidepanel.filteredRegions;
            expect(list.length).toBe(2);
            expect(sidepanel.selectedRegion).toBe(sidepanel.boundRegions[0]);
        });

        it('filtered with a saved region and last is selected', () => {
            sidepanel.boundRegions[1].saved = true;
            sidepanel.selectedRegion = sidepanel.boundRegions[2];
            sidepanel.toggled = true;
            let list = sidepanel.filteredRegions;
            expect(list.length).toBe(2);
            expect(sidepanel.selectedRegion).toBe(sidepanel.boundRegions[2]);
        });
    });

    describe('toggleProcessed', () => {
        it('verify toggling', () => {
            expect(sidepanel.toggled).toBe(false);
            sidepanel.toggleProcessed();
            expect(sidepanel.toggled).toBe(true);
            sidepanel.toggleProcessed();
            expect(sidepanel.toggled).toBe(false);
        });
    });

    describe('_clearValues', () => {
       it('verify empty bound regions', () => {
           sidepanel.validForSave = true; // just to check reset
           sidepanel.boundRegions = [];
           sidepanel._clearValues();
           expect(sidepanel.validForSave).toBe(false);
           expect(sidepanel.selectedRegion).toBeUndefined();
       });

        it('verify clears bound regions', () => {
            sidepanel.validForSave = true; // just to check reset
            sidepanel.boundRegions = [{
                filePath: 'test/image-123.png',
                filename: 'image-123.png',
                valid: true,
                name: 'image-123'
            }, {
                filePath: 'test/image-345.png',
                filename: 'image-345.png',
                valid: true,
                name: 'image-345'
            }];
            sidepanel._clearValues();
            expect(sidepanel.validForSave).toBe(false);
            expect(sidepanel.selectedRegion).toBe(sidepanel.boundRegions[0]);
        })
    });

    describe('_setDefaultValues', () => {
        it('folder and options are set', () => {
            sidepanel.defaultConfig = {
                folder:  'Germany',
                altPath: 'used'
            };
            sidepanel.boundRegions = [];
            sidepanel.boundRegions.push({folder: 'test', altPath: ''});
            sidepanel.boundRegions.push({});

            sidepanel._setDefaultValues();
            _.forEach(sidepanel.boundRegions, region => {
                expect(region.folder).toBe('Germany');
                expect(region.altPath).toBe('used');
            });
        });
    });
});
