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
import {ImageHandler} from 'processing/image/image-handler';
import {ImageBounds} from 'model/image-bounds';

import _ from 'lodash';


describe('ImageHandler', () => {

    let imageHandler;

    let i18nSpy = jasmine.createSpyObj('i18n', ['tr']);
    let eventAggregatorSpy = jasmine.createSpy('eventAggregator');
    let imageProcessorSpy = jasmine.createSpy('imageProcessor');

    beforeEach(() => {
       imageHandler = new ImageHandler(eventAggregatorSpy, i18nSpy, imageProcessorSpy);
    });

    describe('_processSavedRegions', () => {

        let regions;
        let dupes;

        beforeEach(() => {
            regions = [];
            dupes = [];

            for(let i = 0; i < 5; i++ ) {
                let region = new ImageBounds({image: 'ABCDEF0123456789'});
                _.set(region, 'name', 'stamp-' + i);
                _.set(region, 'imageType', 'jpg');
                _.set(region, 'folder.name', 'country-name-' + i);
                regions.push(region);

                dupes.push({
                    name: 'stamp-' + i,
                    imageType: 'jpg',
                    folder: {
                        name: 'country-name-' + i,
                    },
                    exists: true,
                    saved: false
                });
            }
        });

        it('no regions were duplicates', () => {
            _.forEach(dupes, d => {
                d.exists = false;
                d.saved = true;
            });
            let duplicates = imageHandler._processSavedRegions(regions, dupes);
            expect(_.size(duplicates)).toBe(0);
        });

        it('all regions were duplicates', () => {
            let duplicates = imageHandler._processSavedRegions(regions, dupes);
            expect(_.size(duplicates)).toBe(5);
        });

        it('all but one region was a duplicate', () => {
            dupes[1].exists = false;
            dupes[1].saved = true;
            let duplicates = imageHandler._processSavedRegions(regions, dupes);
            expect(_.size(duplicates)).toBe(4);
        });
    });

    describe('_imageToMimeType', () => {

        it('handles jpg', () => {
            let mime = imageHandler._imageToMimeType('jpg');
            expect(mime).toBe('image/jpeg');
        })

        it('handles png', () => {
            let mime = imageHandler._imageToMimeType('png');
            expect(mime).toBe('image/png');
        })

        it('handles tiff', () => {
            let mime = imageHandler._imageToMimeType('tiff');
            expect(mime).toBe('image/tiff');
        })
    });
});
