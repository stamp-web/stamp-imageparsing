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

import {customElement, bindable, computedFrom, bindingMode, inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';
import {I18N} from 'aurelia-i18n';
import {EventNames} from '../../../util/constants';

@customElement('file-input')
@inject(Element, I18N, EventAggregator)
export class FileInput {
    @bindable({defaultBindingMode: bindingMode.twoWay}) value;
    @bindable disabled = false;
    @bindable folderMode = true;
    @bindable callback;
    @bindable placeholderText;
    @bindable showRemove = true;
    @bindable name;

    selectedFiles;
    options = {};
    _subscribers = [];

    constructor(element, i18n, eventAggregator) {
        this.eventAggregator = eventAggregator;
        this.i18n = i18n;
        this.element = element;
    }

    attached() {
        this._configureFolderMode();
        this._subscribers.push(this.eventAggregator.subscribe(EventNames.FILE_OPEN, name => {
            if(name === this.name) {
                this.openSelector();
            }
        }));
    }

    openSelector() {
        if(this.value) {
            _.set(this.options, 'defaultPath', this.value);
        }
        ipcRenderer.invoke('showFileDialog', this.options).then(selectedFiles => {
           this.selectedFiles = selectedFiles;
            if (this.callback) {
                this.callback(this.selectedFiles);
            }
            this.value = _.head(this.selectedFiles);
        });
    }

    detached() {
        _.forEach(this._subscribers, sub => {
            sub.dispose();
        });
    }

    remove() {
        this.value = undefined;
        if (this.callback) {
            this.callback(this.value);
        }
    }

    disabledChanged() {
        this.disabled = (this.disabled == 'true');
    }

    showRemoveChanged() {
        this.showRemove = (this.showRemove == 'true');
    }

    folderModeChanged() {
        this.folderMode = (this.folderMode == 'true');
        this._configureFolderMode();
    }

    _configureFolderMode() {
        _.set(this.options, 'folderMode', this.folderMode === true);
    }
    @computedFrom('value', 'disabled', 'placeholder')
    get showPlaceholder() {
        return this.placeholderText && !this.disabled && (_.isEmpty(this.value) || _.isNil(this.value))
    }

    @computedFrom('value', 'disabled', 'placeholder', 'showRemove')
    get showRemoveIcon() {
        return !this.showPlaceholder && !this.disabled && this.value && this.showRemove;
    }
}
