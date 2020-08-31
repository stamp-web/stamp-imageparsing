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

import {customElement, bindable, inject, computedFrom} from 'aurelia-framework';
import _ from 'lodash';

@inject(Element)
@customElement('string-list-view')
export class StringListView {

    @bindable items = [];
    selected = -1;
    addText = '';

    constructor(element) {
        this.element = element;
    }

    add(text) {
        this.items.push(text);
        this.addText = '';
    }

    selectRow(idx) {
        this.selected = idx;
    }

    @computedFrom('addText', 'items')
    get invalid() {
        return _.isEmpty(this.addText) || _.includes(this.items, this.addText);
    }

    move(idx, direction) {
        if((idx === 0 && direction === -1) || (idx === _.size(this.items) -1 && direction === 1)) {
            return;
        }
        let value = this.items[idx];
        let value2 = this.items[idx + direction];
        this.items.splice(Math.min(idx, idx + direction),2);
        _.defer(() => {
            if(direction < 0) {
                this.items.splice(idx + direction, 0, value, value2);
            }
            else {
                this.items.splice(idx, 0, value2, value);
            }
        });
        this.selected = idx + direction;
    }

    remove( idx) {
        this.items.splice(idx,1);
        if (idx === this.selected) {
            this.selected = -1;
        }
    }
}
