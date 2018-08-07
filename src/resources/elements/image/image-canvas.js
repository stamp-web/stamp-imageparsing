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
import {bindingMode} from 'aurelia-binding';
import {EventAggregator} from 'aurelia-event-aggregator';

import $ from 'jquery';
import _ from 'lodash';

@customElement('image-canvas')
@inject(Element, EventAggregator)
export class ImageCanvas {


    LINE_WIDTH = 2;

    @bindable image;
    @bindable({defaultBindingMode: bindingMode.twoWay}) imageBounds = [];
    @bindable scalingFactor = 1.0;
    @bindable({defaultBindingMode: bindingMode.twoWay}) selectedBox;

    _boxStart;
    _clickMode = ClickMode.select;
    _ctx;   // 2d canvas context
    _image; // HTMLImageElement
    _subscribers = [];

    constructor(element, eventAggregator) {
        this.element = element;
        this.eventAggregator = eventAggregator;
    }

    attached() {
        this.clear();
        this._setupListeners();
    }

    detached() {
        this._cleanupImage();
        _.forEach(this._subscribers, sub => {
            sub.dispose();
        });
    }

    _setupListeners() {
        this._subscribers.push(this.eventAggregator.subscribe('add-bounding-box', () => {
            this._clickMode = ClickMode.box;
        }));
        this._subscribers.push(this.eventAggregator.subscribe('delete-selected', this.deleteSelected.bind(this)));
    }

    deleteSelected() {
        if (this.selectedBox) {
            _.pull(this.imageBounds, this.selectedBox);
            this.selectedBox = undefined;
            this.repaint();
        }
    }

    clickCanvas(evt) {
        if (this._clickMode === ClickMode.select) {
            let previousBox = this.selectedBox;
            this.selectedBox = undefined;
            _.forEachRight(this.imageBounds, box => {
                if (this._isSelectionWithinBox(box, evt.offsetX / this.scalingFactor, evt.offsetY / this.scalingFactor)) {
                    if (previousBox === box) {
                        return true;
                    }
                    this.selectedBox = box;
                    this.repaint();
                    return false;
                }
            });
            if (!this.selectedBox && previousBox) {
                this.selectedBox = previousBox;
            }
        }
    }

    mouseDownCanvas(evt) {
        if (this._clickMode === ClickMode.box) {
            this._boxStart = {
                x: evt.offsetX,
                y: evt.offsetY
            };
        } else if (this._clickMode == ClickMode.select && this.selectedBox) {
         //   console.log("near?", this._isNearSelectionEdge(this.selectedBox, evt.offsetX, evt.offsetY));
            if (this._isNearSelectionEdge(this.selectedBox, evt.offsetX, evt.offsetY)) {
                this._clickMode == ClickMode.resize;
            }
        }
    }

    mouseMoveCanvas(evt) {
        if (this._clickMode === ClickMode.box && this._boxStart) {
            this.repaint();
            _.defer(() => {
                let ctx = this._getContext();
                ctx.strokeStyle = '#0FF';
                ctx.setLineDash([10, 2]);
                ctx.lineWidth = this.LINE_WIDTH;
                ctx.strokeRect(this._boxStart.x, this._boxStart.y,
                    evt.offsetX - this._boxStart.x, evt.offsetY - this._boxStart.y);
            });
        } else if (this._clickMode === ClickMode.resize) {
          //  console.log('resizing');
        }
    }

    mouseUpCanvas(evt) {
        if (this._clickMode === ClickMode.box && this._boxStart) {
            this.repaint();
            let x = this._boxStart.x;
            let y = this._boxStart.y;
            let w = (evt.offsetX - this._boxStart.x);
            let h = evt.offsetY - this._boxStart.y;
            if (w < 0) {
                x = x + w;
            }
            if (h < 0) {
                y = y + h;
            }
            let box = {
                x:      x / this.scalingFactor,
                y:      y / this.scalingFactor,
                width:  Math.abs(w) / this.scalingFactor,
                height: Math.abs(h) / this.scalingFactor
            };
            this.imageBounds.push(box);
            this.selectedBox = box;
            this._boxStart = undefined;
            _.defer(() => { // the click event will activate with select so defer
                this._clickMode = ClickMode.select;
            });

        }
    }

    _isSelectionWithinBox(box, x, y) {
        return ( box.x < x && box.x + box.width > x && box.y < y && box.y + box.height > y);
    }

    _isNearSelectionEdge(box, x, y) {
        let delta = 10;
        return ((((x > box.x - delta) && (x < box.x + delta)) || ((x > box.x + box.width - delta) && (x < box.x + box.width + delta))) &&
            (((y > box.y - delta) && (y < box.y + delta)) || ((y > box.y + box.height - delta) && (y < box.y + box.height + delta)))
        );
    }

    _getContext() {
        if (!this._ctx) {
            let cvs = this._getCanvas();
            if (cvs.length > 0) {
                this._ctx = cvs[0].getContext('2d');
            }
        }
        return this._ctx;
    }

    _getCanvas() {
        return $(this.element).find('canvas');
    }

    _cleanupImage() {
        if (this._image && this._image.src) {
            URL.revokeObjectURL(this._image.src)
        }
    }

    clear() {
        let canvas = this._getCanvas();
        let ctx = this._getContext();
        ctx.fillStyle = '#111';
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    paint(newImage) {
        if (newImage) {
            let img = new Image();
            img.onload = () => {
                let cvs = this._getCanvas();
                // We need to set the HTML attributes of the Canvas vs. using CSS since the CSS properties are for the
                // visible size only
                this._getContext().lineWidth = 1.0;
                cvs.attr('width', img.width * this.scalingFactor);
                cvs.attr('height', img.height * this.scalingFactor);
                this._getContext().drawImage(img, 0, 0, img.width, img.height, 0, 0,
                    img.width * this.scalingFactor, img.height * this.scalingFactor);
            }
            img.src = newImage;
            this._image = img;
        }
    }

    repaint() {
        this.paint(this.image);
        _.defer(() => {
            this.paintImageBounds();
        });
    }

    scalingFactorChanged(newFactor) {
        this.repaint();
    }

    imageBoundsChanged(newRects) {
        if (newRects) {
            this.imageBounds = newRects;
            this.paintImageBounds();
        }
    }

    paintImageBounds() {
        let ctx = this._getContext();

        ctx.lineWidth = this.LINE_WIDTH;
        _.forEach(this.imageBounds, rect => {
            ctx.strokeStyle = (rect === this.selectedBox) ? '#ee2222' : '#22cc22';
            ctx.strokeRect(rect.x * this.scalingFactor, rect.y * this.scalingFactor,
                rect.width * this.scalingFactor, rect.height * this.scalingFactor);
        });
    }

    /**
     *
     * @param newImage - the BLOB or Data String representing an image
     */
    imageChanged(newImage) {
        this._cleanupImage();
        this.clear();
        this.paint(newImage);
    }

}

class ClickMode {

    static box = 'box';
    static select = 'select';
    static resize = 'resize';
}
