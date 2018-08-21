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

import {customElement, inject, bindable, LogManager, BindingEngine} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {remote} from 'electron';
import {ImageHandler} from 'processing/image/image-handler';

@customElement('main-panel')
@inject(ImageHandler, EventAggregator, BindingEngine)
export class MainPanel {

    @bindable boxes = [];
    @bindable boundRegions = [];
    selectedBox;
    imageBlob;

    scalingFactor = 1.0;
    image;

    data;
    chosenFile;
    handler;
    processing;

    subscribers = [];


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
        this.subscribers.push(this.eventAggregator.subscribe('new-box', this._handleNewBox.bind(this)));
        this.subscribers.push(this.bindingEngine.collectionObserver(this.boxes).subscribe(this.boxesChanged.bind(this)));
    }

    _handleCanvasClick(clickData) {
        console.log(">>> ", clickData.x, ' and ', clickData.y);
    }

    _handleNewBox(box) {
        this.boundRegions.push(this._createRegion(box, this.boundRegions.length));
        this.selectedBox = box;
    }

    _handleSelectionChange(box) {
        this.selectedBox = box;
    }

    boxesChanged(newBoxes) {
        this.boundRegions.splice(0, this.boundRegions.length);
        _.defer(() => {
            _.forEach(this.boxes, (box, index) => {
                this.boundRegions.push(this._createRegion(box, index));
            });
        });

    }

    _createRegion(box, index) {
        return {
            name:  'Region-' + index,
            image: box.image,
            box: box
        };
    }

    fileSelected() {
        if (this.chosenFile.length > 0) {
            let f = this.chosenFile[0];
            this.clear();
            this.handler.readImage(f).then((result) => {
                this.data = result.data;
                this.image = this.handler.asDataUrl(this.data);
            });
        }
    }

    addBox() {
        this.eventAggregator.publish('add-bounding-box');
    }

    deleteSelected() {
        this.eventAggregator.publish('delete-selected');
    }

    clear() {
        this.data = undefined;
        this.boxes.splice(0, this.boxes.length);
        this.boundRegions.splice(0, this.boundRegions.length);
        this.selectedBox = undefined;
    }

    zoom(factor) {
        if (factor > 0) {
            this.scalingFactor = this.scalingFactor / 0.5;
        } else {
            this.scalingFactor = this.scalingFactor * 0.5;
        }
    }

    process(f) {
        if (this.data) {
            this.handler.process(this.data, {}).then(info => {
                this.boxes = info.boxes;
            });
        }
    }
}
