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
import {bindingMode} from 'aurelia-binding';
import _ from 'lodash';

@customElement('side-panel')
@inject(EventAggregator, BindingEngine)
export class SidePanel {

    @bindable boundRegions = [];
    @bindable selectedBox;

    subscribers = [];

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

    regionName(region) {
        return (region.filePath ? region.filePath : region.name);
    }

    regionsChanged() {
        let first = _.first(this.boundRegions);
        if(first) {
            first.expanded = true;
        }
    }

    selectedBoxChanged(newBox) {
        _.defer(() => {
            let region = _.find(this.boundRegions, {rectangle: this.selectedBox});
            this.expand(region);
        });
    }

    expand(region) {
        if(region) {
            _.forEach(this.boundRegions, iter => {
                iter.expanded = false;
            });
            region.expanded = true;
            this.eventAggregator.publish('selection-changed', region.rectangle);
        }

    }
}
