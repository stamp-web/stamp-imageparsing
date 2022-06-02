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
import {CreateFolderDialog} from 'resources/elements/dialogs/create-folder-dialog';
import _ from 'lodash';
import {createSpyObj} from 'jest-createspyobj';

describe('CreateFolderDialog', () => {

    let dialog;

    let createComponent = () => {
        let dialogControllerSpy = createSpyObj('dialogController', []);
        return new CreateFolderDialog(dialogControllerSpy);
    };

    describe('attached', () => {
        beforeEach(() => {
            dialog = createComponent();
        });

        it('focus state is set', () => {
            expect(dialog.hasFocus).toBe(false);
            dialog.attached();
            expect(dialog.hasFocus).toBe(true);
        });
    });

    describe('folderNameChanged', () => {
        beforeEach(() => {
            dialog = createComponent();
        });

        it('folder name ignored when no focus', () => {
            expect(dialog.hasFocus).toBe(false);
            dialog.folderName = 'test';
            dialog.folderNameChanged();
            expect(dialog.hasFocus).toBe(false);
        });

        it('folder name ignored when no focus', () => {
            expect(dialog.hasFocus).toBe(false);
            dialog.folderName = '';
            dialog.folderNameChanged();
            expect(dialog.hasFocus).toBe(true);
        });
    });

});
