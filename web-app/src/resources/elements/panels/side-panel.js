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
import {customElement, bindable, BindingEngine, computedFrom} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {ImageBounds} from 'model/image-bounds';
import {EventNames, ImageTypes, KeyCodes} from 'util/constants';
import {RegionDefaultsDialog} from 'resources/elements/dialogs/region-defaults-dialog';
import _ from 'lodash';


@customElement('side-panel')
export class SidePanel {

    static inject = [EventAggregator, BindingEngine, DialogService];

    @bindable boundRegions;
    @bindable folders = [];
    @bindable options = {};
    @bindable selectedRegion;

    defaultConfig = { };

    subscribers = [];
    validForSave = false;
    toggled = false;

    imageTypes = ImageTypes;
    altPaths = [
        {label: ' ', value: ''},
        {label: 'used', value: 'used'},
        {label: 'Reference', value: 'reference'}
    ];

    constructor(eventAggregator, bindingEngine, dialogService) {
        this.eventAggregator = eventAggregator;
        this.bindingEngine = bindingEngine;
        this.dialogService = dialogService;
    }

    attached() {
        this.subscribers.push(this.bindingEngine.collectionObserver(this.boundRegions).subscribe(this.regionsChanged.bind(this)));
    }

    detached() {
        _.forEach(this.subscribers, sub => {
            sub.dispose();
        });
    }

    foldersChanged() {
        this.defaultConfig.folders = this.folders;
    }

    regionsChanged(splices) {
        let count = _.reduce(splices, (sum, obj) => {
            return sum + obj.addedCount;
        }, 0);
        if (count > 0) {
            this._setDefaultFolder();
        }
    }

    toggleProcessed() {
        this.toggled = !this.toggled;
    }

    @computedFrom('toggled', 'boundRegions')
    get filteredRegions() {
        if (!this.toggled) {
            this.selectedRegion = _.find(this.boundRegions, this.selectedRegion) || _.first(this.boundRegions);
            return this.boundRegions;
        } else {
            let filtered = _.filter(this.boundRegions, r => {
                return !r.saved;
            });
            this.selectedRegion = _.find(filtered, this.selectedRegion) || _.first(filtered);
            return filtered;
        }
    }

    _setDefaultFolder() {
        let folder = _.get(this.defaultConfig, 'folder');
        if (folder) {
            _.each(this.boundRegions, region => {
                region.folder = folder;
            });
        }
    }


    clearValues() {
        _.each(this.boundRegions, region => {
            if (region.filePath) {
                region.name = ImageBounds.nextName();
            }
           region.filePath = undefined;
           region.filename = undefined;
           region.valid = this.isValidRegion(region);

        });
        this.validForSave = false;
        this.selectedRegion = _.first(this.boundRegions);
    }

    setDefaults() {
        this.dialogService.open({
            viewModel: RegionDefaultsDialog,
            model: this.defaultConfig
        }).then(dialogResult => {
            return dialogResult.closeResult;
        }).then((response) => {
            if (!response.wasCancelled) {
                _.set(this.defaultConfig, 'folder', _.get(response, 'output.folder'));
                this._setDefaultFolder();
            }
        });
    }

    saveValues() {
        let saveRegions = [];
        _.each(this.filteredRegions, region => {
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

    checkTab(event, region) {
        this.tabPressed = (event.keyCode === KeyCodes.TAB);
        return true;
    }

    filenameUpdated(event, region) {
        region.valid = this.isValidRegion(region);
        this.validForSave = _.some(this.boundRegions, {valid: true});
        this.updateFilePath(region);
        this._handleTabPressed(region);
        return true;
    }

    _handleTabPressed(region) {
        if (this.tabPressed) {
            let index = _.indexOf(this.boundRegions, region) + 1;
            if (index > 0 && index < this.boundRegions.length) {
                this.selectedRegion = this.boundRegions[index];
            }
            this.tabPressed = false;
        }
    }

    rotate(region) {
        let angle = region.rotate || 0;
        region.rotate = (angle + 90) % 360;
    }

    rotationClass(region) {
        if (!region.rotate) {
            return '';
        }
        return 'rotate-' + region.rotate;
    }

    updateFilePath(region) {
        if (region.filename) {
            region.filePath =  region.filename + "." + region.imageType;
            region.name = region.filePath;
            this.eventAggregator.publish(EventNames.SELECTION_CHANGED, region);
        } else if (!region.name) {
            region.name = ImageBounds.nextName();
        }
    }

    selectedRegionChanged() {
        let region = _.find(this.boundRegions, o => {
            o.hasFocus = false;
            return o === this.selectedRegion
        });
        if (region) {
            region.hasFocus = true;
            this.expand(region);
        }
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
