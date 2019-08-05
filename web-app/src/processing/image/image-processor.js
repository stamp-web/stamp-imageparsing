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
import {EventAggregator} from 'aurelia-event-aggregator';
import {EventNames, StorageKeys} from "../../util/constants";
import _ from "lodash";
import {ConnectionService} from "../connection-service";

export class ImageProcessor {

    static inject = [ConnectionService, EventAggregator];

    constructor(connectionService, eventAggregrator) {
        this.connectionService = connectionService;
        this.eventAggregator = eventAggregrator;
    }

    process(inputFile, options) {
        let payload = {
            file:    inputFile,
            options: options
        };
        this.eventAggregator.publish(EventNames.REMOTE_MESSAGING);
        return this.connectionService.post('/api/svc/process-image', payload);
    }

}
