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

import {customElement, bindable, bindingMode} from 'aurelia-framework';
import _ from 'lodash';

@customElement('toggle-button')
export class ToggleButton {

    @bindable({defaultBindingMode: bindingMode.twoWay}) value = false;

    constructor() {

    }

    valueChanged(value) {
        this.value = _.isString(value) ? value.toLowerCase() === 'true': !!value;
    }

    toggle() {
        this.value = !this.value;
    }
}
