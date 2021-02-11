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
import {MessagePromptDialog} from 'resources/elements/dialogs/message-prompt-dialog';

describe('MessagePromptDialog', () => {

    let dialog;

    let createComponent = () => {
        let dialogControllerSpy = jasmine.createSpy('dialogController');
        return new MessagePromptDialog(dialogControllerSpy);
    };

    describe('activate', () => {
        beforeEach(() => {
            dialog = createComponent();
        });

        it('standard activation', () => {
            let model = 'test of message';
            dialog.activate(model);
            expect(dialog.message).toBe('test of message');
        });
    });
});
