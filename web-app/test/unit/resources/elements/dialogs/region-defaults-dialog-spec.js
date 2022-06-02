/*
 Copyright 2021 Jason Drake (jadrake75@gmail.com)

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
import {RegionDefaultsDialog} from 'resources/elements/dialogs/region-defaults-dialog';
import _ from 'lodash';
import {createSpyObj} from 'jest-createspyobj';

describe('RegionDefaultsDialog', () => {

    let dialog;

    let createComponent = () => {
        let dialogControllerSpy = createSpyObj('dialogController', []);
        return new RegionDefaultsDialog(dialogControllerSpy);
    };

    describe('activate', () => {

        beforeEach(() => {
            dialog = createComponent();
        });

        it('model correctly set', () => {
            let data = {
                key: 'value',
                folders: ['folder1', 'folder2'],
                folder: 'test-folder'
            };
            dialog.activate(data);
            expect(dialog.model).toBe(data);
            expect(dialog.config.folder).toBe('test-folder');
            expect(dialog.folders.length).toBe(2);
        });
    });

});
