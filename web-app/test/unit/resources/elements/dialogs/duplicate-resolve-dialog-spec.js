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
import {DuplicateResolveDialog, ToggleButton} from 'resources/elements/dialogs/duplicate-resolve-dialog';
import _ from 'lodash';

describe('DuplicateResolveDialog', () => {

    let dialog;
    let imageHandlerSpy;

    beforeEach(() => {
        let dialogControllerSpy = jasmine.createSpy('dialogController');
        imageHandlerSpy = jasmine.createSpyObj('imageHandler', ['asDataUrlFromFile']);
        dialog = new DuplicateResolveDialog(dialogControllerSpy, imageHandlerSpy);
    });

    describe('getImage', () => {
        it('returns dataURL', done => {
            let data = 'data:image/png;base64,012345ABCDEFABCDEF';
            let duplicate = {
                folder: {
                    path: 'c:/test'
                },
                filePath: 'image1.png'
            };
            imageHandlerSpy.asDataUrlFromFile.and.returnValue(Promise.resolve(data));
            dialog.getImage(duplicate).then(() => {
                expect(imageHandlerSpy.asDataUrlFromFile).toHaveBeenCalled();
                expect(duplicate.duplicateImage).toBe(data);
                done();
            });
        });

        it('cached dataURL used', done => {
            let data = 'data:image/png;base64,012345ABCDEFABCDEF';
            let duplicate = {
                duplicateImage: data,
                folder: {
                    path: 'c:/test'
                },
                filePath: 'image1.png'
            };
            dialog.getImage(duplicate).then(() => {
                expect(imageHandlerSpy.asDataUrlFromFile).not.toHaveBeenCalled();
                expect(duplicate.duplicateImage).toBe(data);
                done();
            });
        });
    });

    describe('getChosenDuplicates', () => {

        beforeEach(() =>{
            dialog.duplicates = [
                {
                    filePath: 'image1.png'
                },
                {
                    filePath: 'image2.png'
                },
                {
                    filePath: 'image3.png'
                }
            ];
        });

        it('no duplicates', () => {
            let dupes = dialog.getChosenDuplicates();
            expect(_.size(dupes)).toBe(0);
        });

        it('some duplicates', () => {
            dialog.duplicates[1].overwrite = true;
            let dupes = dialog.getChosenDuplicates();
            expect(_.size(dupes)).toBe(1);
            expect(dupes[0].filePath).toBe('image2.png');
        });

        it('all duplicates', () => {
            _.forEach(dialog.duplicates, d => {
                d.overwrite = true;
            });
            let dupes = dialog.getChosenDuplicates();
            expect(_.size(dupes)).toBe(3);
        });
    });

    describe('rotationClass', () => {
        beforeEach(() =>{
            dialog.duplicates = [
                {
                    filePath: 'image1.png',
                    rotate: 180
                },
                {
                    filePath: 'image2.png',
                    rotate: 270
                },
                {
                    filePath: 'image3.png'
                }
            ];
        });

        it('rotate-270', () => {
            let rotate = dialog.rotationClass(dialog.duplicates[1]);
            expect(rotate).toBe('rotate-270');
        });

        it('rotate-270', () => {
            let rotate = dialog.rotationClass(dialog.duplicates[1]);
            expect(rotate).toBe('rotate-270');
        });

        it('rotate', () => {
            let rotate = dialog.rotationClass(dialog.duplicates[2]);
            expect(rotate).toBe('');
        });
    });

});
