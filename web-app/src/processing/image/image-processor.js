/*
 Copyright 2019 Jason Drake (jadrake75@gmail.com)

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
import {HttpClient, json} from 'aurelia-fetch-client';

export class ImageProcessor {

    static inject = [HttpClient];

    constructor(client) {
        this.client = client;
    }

    process(inputFile) {
        let q = new Promise((resolve, reject) => {
            let payload = {
                file: inputFile
            };
            this.client.fetch('/api/svc/process-image', {
                method: 'post',
                body:   JSON.stringify(payload)
            }).then(result => {
                resolve(result.json());
            }).catch(err => {
                reject(err);
            });
        });
        return q;
    }

}
