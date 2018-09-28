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

import {customElement, computedFrom, inject, bindable, LogManager, BindingEngine} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {remote} from 'electron';
import {ImageHandler} from 'processing/image/image-handler';
import {ImageBounds} from 'model/image-bounds';
import _ from 'lodash';

@customElement('main-panel')
@inject(ImageHandler, EventAggregator, BindingEngine)
export class MainPanel {

    @bindable boxes = [];
    @bindable boundRegions = [];
    @bindable selectedRegion;

    toobig = false;
    toosmall = false;

    scalingFactor = 1.0;
    image;

    data;
    chosenFile;
    meta;
    handler;
    processing = false;

    subscribers = [];

    _MAX_ZOOM = 4.0;
    _MIN_ZOOM = 0.25;

    constructor(imageHandler, eventAggregator, bindingEngine) {
        this.handler = imageHandler;
        this.eventAggregator = eventAggregator;
        this.bindingEngine = bindingEngine;
        this.logger = LogManager.getLogger('main-panel');

    }

    attached() {
        this._setupListeners();
    }

    detached() {
        _.forEach(this.subscribers, sub => {
            sub.dispose();
        });
    }

    _setupListeners() {
        this.subscribers.push(this.eventAggregator.subscribe('canvas-click', this._handleCanvasClick.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe('selection-changed', this._handleSelectionChange.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe('new-image-bounds', this._handleNewImageBounds.bind(this)));
        this.subscribers.push(this.bindingEngine.collectionObserver(this.boxes).subscribe(this.boxesChanged.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe('save-regions', this._handleSaveRegions.bind(this)));
    }

    _handleCanvasClick(clickData) {
        console.log(">>> ", clickData.x, ' and ', clickData.y);
    }

    _handleNewImageBounds(boundImage) {
        this.boundRegions.push(boundImage);
        this.selectedRegion = boundImage;
    }

    _handleSelectionChange(region) {
        this.selectedRegion = region;
    }

    _handleSaveRegions(regions) {
        this.handler.saveRegions(this.data, regions, {});
    }

    boxesChanged(newBoxes) {
        this.boundRegions.splice(0, this.boundRegions.length);
        this.selectedRegion = undefined;
        _.defer(()=> { // allow other components to cleanup
            _.forEach(newBoxes, (box, index) => {
                let region = new ImageBounds({
                    rectangle: box
                });
                this.boundRegions.push(region);
                if (index === 0) {
                   this.selectedRegion = region;
                }
            });
        });

    }

    fileSelected() {
        if (this.chosenFile.length > 0) {
            let f = this.chosenFile[0];
            this.processing = true;

            this.meta = {
                name:         f.name,
                originalSize: f.size,
                mimeType:     f.type
            };
            this.clear();
            this.handler.readImage(f).then((result) => {
                this.data = result.data;
                this.image = this.handler.asDataUrl(this.data, this.meta);
                this.processing = false;
            });
        }
    }

    @computedFrom('boundRegions.length')
    get showSidePanel() {
        return this.boundRegions.length > 0;
    }

    addRectangle() {
        this.eventAggregator.publish('add-rectangle');
    }

    deleteSelected() {
        let index = _.findIndex(this.boundRegions, o => { return o === this.selectedRegion});
        if (index >= 0) {
            this.boundRegions.splice(index, 1);
            this.eventAggregator.publish('delete-selected', this.selectedRegion);
            this.selectedRegion = undefined;
        }
    }

    clear() {
        this.data = undefined;
        this.clearBoxes();
    }

    clearBoxes() {
        this.boxes.splice(0, this.boxes.length);
        this.boundRegions.splice(0, this.boundRegions.length);
        this.selectedRegion = undefined;
    }

    zoom(factor) {
        this.toobig = false;
        this.toosmall = false;
        if (factor > 0) {
            this.scalingFactor = Math.min(this.scalingFactor / 0.5, this._MAX_ZOOM);
        } else {
            this.scalingFactor = Math.max(this.scalingFactor * 0.5, this._MIN_ZOOM);
        }
        if (this.scalingFactor <= this._MIN_ZOOM) {
            this.toosmall = true;
        } else if (this.scalingFactor >= this._MAX_ZOOM) {
            this.toobig = true;
        }
    }

    process(f) {
        this.processing = true;
        this.clearBoxes();

        _.delay(() => {
            if (this.data) {
                this.handler.process(this.data, {}).then(info => {
                    this.boxes = info.boxes;
                    this.processing = false;
                });
            }
        }, 50);

    }
}