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

import {DialogController} from "aurelia-dialog";
import {HttpClient} from 'aurelia-fetch-client';

export class AboutDialog {
    static inject = [DialogController];

    httpClient;

    constructor(dialogController) {
        this.controller = dialogController;
        this.httpClient = new HttpClient();
    }

    attached() {
        return this.httpClient.get('package.json').then(resp => {
            resp.json().then(content => {
                this.info = content;
            })

        }).catch (err => {
            console.log('Unexpected error reading from package.json', err);
        });
    }
}
