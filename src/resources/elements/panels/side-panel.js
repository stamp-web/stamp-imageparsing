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
import {customElement, bindable, inject, BindingEngine} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {EventNames} from 'util/constants';
import _ from 'lodash';

@customElement('side-panel')
@inject(EventAggregator, BindingEngine)
export class SidePanel {

    @bindable boundRegions = [];
    @bindable selectedRegion;

    subscribers = [];
    validForSave = false;

    constructor(eventAggregator, bindingEngine) {
        this.eventAggregator = eventAggregator;
        this.bindingEngine = bindingEngine;

    }

    detached() {
        _.forEach(this.subscribers, sub => {
            sub.dispose();
        });
    }

    attached() {
        this.subscribers.push(this.bindingEngine.collectionObserver(this.boundRegions).subscribe(this.regionsChanged.bind(this)));
    }

    regionsChanged() {
        let first = _.first(this.boundRegions);
        if(first) {
            first.expanded = true;
        }
    }
    clearValues() {
        _.each(this.boundRegions, region => {
           region.filePath = undefined;
           region.filename = undefined;
        });
        this.validForSave = false;
    }

    saveValues() {
        let saveRegions = [];
        _.each(this.boundRegions, region => {
            if(this.isValidRegion(region)) {
                saveRegions.push(region);
            }
        });
        if(saveRegions.length > 0) {
            this.eventAggregator.publish(EventNames.SAVE_REGIONS, saveRegions);
        }
    }

    isValidRegion(region) {
        return !_.isEmpty(region.filename) && !_.isNil(region.rectangle);
    }

    filenameUpdated(event, region) {
        if(!this.validForSave && this.isValidRegion(region)) {
            this.validForSave = true;
        }
        region.filePath = region.filename;
        return true;
    }

    selectedRegionChanged(newBox) {
        let region = _.find(this.boundRegions, o => {return o === this.selectedRegion});
        region.hasFocus = true;
        this.expand(region);
    }

    expand(region) {
        if(region) {
            _.forEach(this.boundRegions, iter => {
                iter.expanded = false;
            });
            region.expanded = true;
            this.eventAggregator.publish(EventNames.SELECTION_CHANGED, region);
        }

    }
}
