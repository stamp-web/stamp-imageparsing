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
import {AboutDialog} from 'resources/elements/dialogs/about-dialog';
import _ from 'lodash';
import {createSpyObj} from 'jest-createspyobj';

describe('AboutDialog', () => {

    let dialog;

    let createComponent = () => {
        let dialogControllerSpy = createSpyObj('dialogController', []);
        return new AboutDialog(dialogControllerSpy);
    };

    describe('default states', () => {
        beforeEach(() => {
            dialog = createComponent();
        });

        afterEach(() => {
            jest.resetAllMocks();
        })

        it('package json is read', done => {
            let json = {
                productName: 'Stamp Image Bursting Application'
            };
            dialog.httpClient.get = jest.fn(() => {
                let resp = {};
                resp.json = jest.fn(content => {
                    return Promise.resolve(json);
                });
                return Promise.resolve(resp);
            });
            dialog.attached().then(() => {
                expect(dialog.info).not.toBeUndefined();
                expect(dialog.info.productName).toBe('Stamp Image Bursting Application');
                done();
            });
        });

        it('package json has failure', done => {
            dialog.httpClient.get = jest.fn(() => {
                return Promise.reject("something went wrong");
            });
            dialog.attached().then(() => {
                expect(dialog.info).toBeUndefined();
                done();
            });


        });
    });

});
