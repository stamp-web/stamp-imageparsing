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
import {MainPanel} from 'resources/elements/panels/main-panel';
import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';
import {createSpyObj} from 'jest-createspyobj';

describe('MainPanel', () => {


    let mainpanel;

    let i18nSpy = createSpyObj('i18n', ['tr']);
    let routerSpy = createSpyObj('router', ['navigate']);
    const fileManager = createSpyObj('fileManager', ['getMimeType', 'getFolders']);
    let element = {};

    beforeEach(() => {
        fileManager.getMimeType.mockResolvedValue('image/tiff');
        mainpanel = new MainPanel(element, i18nSpy, routerSpy, undefined, undefined, fileManager /* Does not include others yet */);
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

    describe('handleFolderSelected', () => {
        const TARGET_FOLDER = '<Target Folder>';

        beforeEach(() => {
            i18nSpy.tr.mockReturnValue(TARGET_FOLDER);
            // since _.defer will cause the execution to be deferred in the event loop, we want to immediately call it to execute contents.
            jest.spyOn(_, 'defer').mockImplementation(f => f());
        });

        it('verify no child folders', async () => {
            mainpanel.fileManager.getFolders.mockResolvedValue([]);
            mainpanel._handleFolderSelected('c:\\temp');
            await new Promise(process.nextTick);

            expect(mainpanel.outputPath).toBe('c:\\temp');
            expect(mainpanel.folders.length).toBe(1);
            expect(mainpanel.folders[0].name).toBe(TARGET_FOLDER);
        });

        it('verify all folders with parent', async () => {
            let folders = [
                {name:'temp', path: 'c:\\temp'},
                {name:'pictures', path: 'c:\\pictures'}
            ];
            mainpanel.fileManager.getFolders.mockResolvedValue(folders);
            mainpanel._handleFolderSelected('c:\\test-path');
            await new Promise(process.nextTick);
            expect(mainpanel.outputPath).toBe('c:\\test-path');
            expect(mainpanel.folders.length).toBe(3);
            expect(mainpanel.folders[0].name).toBe(TARGET_FOLDER);
            expect(mainpanel.folders[2]).toStrictEqual(folders[1]);
        });
    });

    describe('setScalingFactor', () => {

        const dataUri = 'data:image/jpeg;base64,R0lGODlhkAGQAfcAAAQCBJKDLJSSlExGHNS/NNTOtFRSVCckFGxjJPjgXMzKzHyCfKuqpDMxNPzu0fXaJGxqZLikLEdCPBQSDDQyFOvq7H90LL6PlFxOw==';

        const mockImage = {
            constructor: () => {},
            src: null,
            onload: () => {}
        };

        beforeEach(() => {
            mainpanel.scalingFactor = 2.0; // dummy factor
            mainpanel.options = {};
            mainpanel.dataURI = dataUri;
        });

        it('verify no scaling calculation without option set', () => {
            mainpanel.setScalingFactor(mockImage);
            mockImage.onload();
            expect(mainpanel.scalingFactor).toBeCloseTo(2.0, 2);
        });

        it('scaling calculation run on image load with option set', () => {
            mainpanel.imageCanvas = {offsetWidth: 400, offsetHeight: 400}; // current onscreen canvas size
            _.set(mainpanel.options, 'image.fitImageToWindow', true);
            mockImage.width = 700; // less than twice the size of the canvas
            mockImage.height = 200;
            mainpanel.setScalingFactor(mockImage);
            mockImage.onload(); // we need to ensure onload is called since src is not really triggering it

            expect(mainpanel.scalingFactor).toBeCloseTo(0.5, 2);
        });

    });

    describe('getScalingFactorFromImage', () => {

        let elem = {};

        beforeEach(() => {
            elem.offsetWidth = 1024;
            elem.offsetHeight = 1024;
        });

        it('verify minimum zoom of 0.125', () => {
            // more than 8x the width
            let image = {height: 2048, width: 8600};
            let factor = mainpanel.getScalingFactorFromImage(elem, image);
            expect(factor).toBeCloseTo(0.125, 4);
        });

        it('verify maximum zoom of 1', () => {
            let image = {height: 600, width: 800};
            let factor = mainpanel.getScalingFactorFromImage(elem, image);
            expect(factor).toBeCloseTo(1.0, 4);
        });

        it('verify zoom to fit wide image', () => {
            let image = {height: 1500, width: 4080};
            let factor = mainpanel.getScalingFactorFromImage(elem, image);
            expect(factor).toBeCloseTo(0.25, 4);
        });

        it('verify zoom to fit tall image', () => {
            let image = {height: 2040, width: 1000};
            let factor = mainpanel.getScalingFactorFromImage(elem, image);
            expect(factor).toBeCloseTo(0.5, 4);
        });
    });
});
