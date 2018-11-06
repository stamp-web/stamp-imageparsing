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
import {customElement, bindable, inject, BindingEngine, LogManager} from 'aurelia-framework';
import {bindingMode} from 'aurelia-binding';
import {EventAggregator} from 'aurelia-event-aggregator';
import {EventNames} from 'util/constants';
import {ImageBounds} from 'model/image-bounds';

import $ from 'jquery';
import _ from 'lodash';

@customElement('image-canvas')
@inject(Element, EventAggregator, BindingEngine)
export class ImageCanvas {


    LINE_WIDTH = 2;

    @bindable image;
    @bindable boundRegions;
    @bindable scalingFactor = 1.0;
    @bindable selectedRegion;
    @bindable style = {
        selected:     '#89b1d3',
        border:       '#c9c9c9',
        create:       '#9ad3de',
        transparency: 0.1
    };


    _boxStart;
    _offscreenBuffer;
    _clickMode = ClickMode.select;
    _ctx;   // 2d canvas context
    _image; // HTMLImageElement
    _subscribers = [];

    constructor(element, eventAggregator, bindingEngine) {
        this.element = element;
        this.eventAggregator = eventAggregator;
        this.bindingEngine = bindingEngine;
        this.logger = LogManager.getLogger('image-canvas');
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
        this._subscribers.push(this.eventAggregator.subscribe('add-rectangle', () => {
            this._clickMode = ClickMode.box;
        }));
        this._subscribers.push(this.eventAggregator.subscribe('delete-selected', this.deleteSelected.bind(this)));
        this._subscribers.push(this.bindingEngine.collectionObserver(this.boundRegions).subscribe(this.regionsChanged.bind(this)));
    }

    deleteSelected() {
        this.repaint();
    }

    selectedRegionChanged(newSelection, oldSelection) {
        if (oldSelection) {
            this._paintRegion(oldSelection.rectangle, oldSelection.name);
        }
        if(newSelection) {
            this._paintRegion(newSelection.rectangle, newSelection.name);
        }
    }

    clickCanvas(evt) {
        if (this._clickMode === ClickMode.select) {
            let previousRegion = this.selectedRegion;
            _.forEachRight(this.boundRegions, region => {
                let rectangle = region.rectangle;
                if (this._isSelectionWithinBox(rectangle, evt.offsetX / this.scalingFactor, evt.offsetY / this.scalingFactor)) {
                    if (_.get(previousRegion, 'rectangle') === rectangle) {
                        return true;
                    }
                    this.eventAggregator.publish(EventNames.SELECTION_CHANGED, region);

                    return false;
                }
            });
            if (!this.selectedRegion && previousRegion) {
                this.logger.warn(">> reseting to previous");
                this.eventAggregator.publish(EventNames.SELECTION_CHANGED, previousRegion);
            }
        }
    }

    mouseDownCanvas(evt) {
        if (this._clickMode === ClickMode.box) {
            this._boxStart = {
                x: evt.offsetX,
                y: evt.offsetY
            };
        } else if (this._clickMode == ClickMode.select && this.selectedRegion) {
            //   console.log("near?", this._isNearSelectionEdge(this.selectedBox, evt.offsetX, evt.offsetY));
            if (this._isNearSelectionEdge(this.selectedRegion.rectangle, evt.offsetX, evt.offsetY)) {
                this._clickMode == ClickMode.resize;
            }
        }
    }

    mouseMoveCanvas(evt) {
        if (this._clickMode === ClickMode.box && this._boxStart) {
            this.repaint();
            _.defer(() => {
                let ctx = this._getContext();
                ctx.strokeStyle = this.style.create;
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
            let rectangle = {
                x:      x / this.scalingFactor,
                y:      y / this.scalingFactor,
                width:  Math.abs(w) / this.scalingFactor,
                height: Math.abs(h) / this.scalingFactor
            };

            let imageBounds = new ImageBounds({
                image:     this._generateCropImage(rectangle),
                rectangle: rectangle
            });
            this.eventAggregator.publish('new-image-bounds', imageBounds);
            this._boxStart = undefined;
            _.defer(() => { // the click event will activate with select so defer
                this._clickMode = ClickMode.select;
            });

        }
    }

    _isSelectionWithinBox(rectangle, x, y) {
        return ( rectangle.x < x && rectangle.x + rectangle.width > x && rectangle.y < y && rectangle.y + rectangle.height > y);
    }

    _isNearSelectionEdge(rectangle, x, y) {
        let delta = 10;
        return ((((x > rectangle.x - delta) && (x < rectangle.x + delta)) || ((x > rectangle.x + rectangle.width - delta) && (x < rectangle.x + rectangle.width + delta))) &&
            (((y > rectangle.y - delta) && (y < rectangle.y + delta)) || ((y > rectangle.y + rectangle.height - delta) && (y < rectangle.y + rectangle.height + delta)))
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

    generateOffScreenCanvas(newImage) {
        if (newImage) {
            let img = new Image();
            img.onload = () => {
                this._offscreenBuffer = document.createElement('canvas');
                this._offscreenBuffer.width = img.width;
                this._offscreenBuffer.height = img.height;
                let context = this._offscreenBuffer.getContext('2d');
                context.drawImage(img, 0, 0, img.width, img.height);
            }
            img.src = newImage;
        }
    }

    crop(canvas, offsetX, offsetY, width, height, callback) {
        var buffer = document.createElement('canvas');
        var b_ctx = buffer.getContext('2d');
        buffer.width = width;
        buffer.height = height;
        b_ctx.drawImage(canvas, offsetX, offsetY, width, height, 0, 0, buffer.width, buffer.height);
        return buffer.toDataURL();
    };


    repaint() {
        this.paint(this.image);
        _.defer(() => {
            this.paintBoundRegions();
        });
    }

    scalingFactorChanged(newFactor) {
        this.repaint();
    }

    regionsChanged() {
        if (this.boundRegions) {
            this.repaint();
            _.forEach(this.boundRegions, (region,index) => {
                let genCrop = (r) => {
                    r.image = this._generateCropImage(r.rectangle);
                };
                if (index === 0) {
                    genCrop(region);
                } else {
                    genCrop(region);
                    _.delay(genCrop, 250, region);
                }

            });
        }
    }

    _generateCropImage(rectangle) {
        return this.crop(this._offscreenBuffer, rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    }

    paintBoundRegions() {
        _.forEach(this.boundRegions, region => {
            this._paintRegion(region.rectangle, region.name);
        });
    }

    _paintRegion(rect, text) {
        let ctx = this._getContext();
        ctx.lineWidth = this.LINE_WIDTH;
        let isSelected = (rect === _.get(this.selectedRegion, 'rectangle'));
        ctx.strokeStyle = isSelected ? this.style.selected : this.style.border;
        ctx.strokeRect(rect.x * this.scalingFactor, rect.y * this.scalingFactor,
            rect.width * this.scalingFactor, rect.height * this.scalingFactor);
        /* Will continuously fill
        if (isSelected) {
            ctx.globalAlpha = this.style.transparency;
            ctx.fillStyle = this.style.selected;
            ctx.fillRect(rect.x * this.scalingFactor, rect.y * this.scalingFactor,
                rect.width * this.scalingFactor, rect.height * this.scalingFactor);
            ctx.globalAlpha = 1.0; // revert
        }
         */
        let fontSize = (this.scalingFactor < 0.5) ? '11px': '14px';
        ctx.font = `small-caps ${fontSize} arial`;
        ctx.lineWidth = 1;
        ctx.fillStyle = isSelected ? this.style.selected : this.style.border;
        ctx.fillText(text, rect.x * this.scalingFactor + 5, rect.y * this.scalingFactor + 15);
    }

    /**
     *
     * @param newImage - the BLOB or Data String representing an image
     */
    imageChanged(newImage) {
        this._cleanupImage();
        this.clear();
        this.paint(newImage);
        this.generateOffScreenCanvas(newImage);
    }

}

class ClickMode {

    static box = 'rectangle';
    static select = 'select';
    static resize = 'resize';
}
