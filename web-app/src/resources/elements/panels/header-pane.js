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

import {customElement, bindable, inject, observable} from "aurelia-framework";
import {EventAggregator} from 'aurelia-event-aggregator';
import {Router} from "aurelia-router";

import {EventNames, StorageKeys} from "../../../util/constants";


@customElement('header-pane')
@inject(Router, EventAggregator)
export class HeaderPane {

    @observable chosenFolder;
    @bindable pageTitle;
    @bindable showOutputFolder = true;
    @bindable callback;

    processing = false;

    constructor(router, eventAggregator) {
        this.router = router;
        this.eventAggregator = eventAggregator;
        this.init();
    }

    init() {
        this.chosenFolder = localStorage.getItem(StorageKeys.OUTPUT_PATH);
    }

    showOutputFolderChanged() {
        this.showOutputFolder = (this.showOutputFolder == 'true');
    }

    chosenFolderChanged() {
        if (this.chosenFolder) {
            localStorage.setItem(StorageKeys.OUTPUT_PATH, this.chosenFolder);
            this.eventAggregator.publish(EventNames.FOLDER_SELECTED, this.chosenFolder);
        }
    }

    home() {
        this.router.navigateToRoute('welcome');
    }
}
