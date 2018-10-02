/*
 Copyright 2018 Jason Drake (jadrake75@gmail.com)

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
import {customElement, bindable, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {bindingMode} from 'aurelia-binding';
import {DefaultOptions, EventNames} from 'util/constants';

import _ from 'lodash';

@customElement('settings-panel')
@inject(EventAggregator)
export class SettingsPanel {

    @bindable options;

    settings = {};
    dpiModes = ['image', 'output'];

    constructor(eventAggregator) {
        this.eventAggregator = eventAggregator;
    }

    optionsChanged(newOptions) {
        this.settings = _.cloneDeep(newOptions);
    }

    reset() {
       this.settings = _.cloneDeep(DefaultOptions);
    }

    save() {
        this.eventAggregator.publish(EventNames.SAVE_SETTINGS, this.settings);
    }
}
