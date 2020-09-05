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
    SELECTED_LINE_WIDTH = 3;

    @bindable image;
    @bindable boundRegions;
    @bindable scalingFactor = 1.0;
    @bindable selectedRegion;
    @bindable style = {
        selected:     '#9ae9bd',
        border:       '#c9c9c9',
        create:       '#8abde6',
        transparency: 0.2
    };

    _boxStart;
    _offscreenBuffer;
    _clickMode = ClickMode.select;
    _ctx;   // 2d canvas context
    _image; // HTMLImageElement
    _subscribers = [];
    _lastCoords = {x:0, y:0};
    _threshold = 5;

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
        this._subscribers.push(this.eventAggregator.subscribe(EventNames.ADD_REGION, () => {
            this._clickMode = ClickMode.box;
        }));
        this._subscribers.push(this.eventAggregator.subscribe(EventNames.SELECT_MODE, () => {
            this._clickMode = ClickMode.select;
        }));

        this._subscribers.push(this.eventAggregator.subscribe('delete-selected', this.deleteSelected.bind(this)));
        this._subscribers.push(this.bindingEngine.collectionObserver(this.boundRegions).subscribe(this.regionsChanged.bind(this)));
        this.repaintDebounced = _.throttle(this.repaint.bind(this), 750);
        this._zoomDebounced = _.debounce(this._zoom.bind(this), 125);

        // Need to add listener directly to set the passive = false flag and avoid chromium warning
        $(this.element)[0].addEventListener('wheel', this.mouseWheel.bind(this), {passive: false});

    }

    deleteSelected() {
        this.repaint();
    }

    selectedRegionChanged(newSelection, oldSelection) {
        // in prior builds we repainted just the new and old selections however
        // if we want the filename to get updated we need to wipe the canvas first to avoid overwriting
        this.repaintDebounced();
        this._observeFilePathChanges(newSelection);
    }

    /**
     * Listen for changes on the selected region's filePath and force a debounced repaint.  This is to handle
     * cases where a user 'updates' the filename and we want it reflected in box without waiting for a selection
     * change.
     *
     * @param newSelection
     * @private
     */
    _observeFilePathChanges(newSelection) {
        if (this.filenameListener) {
            this.filenameListener.dispose();
        }
        if (newSelection) {
            this.filenameListener = this.bindingEngine.propertyObserver(newSelection, 'filePath').subscribe(() => {
                this.repaintDebounced();
            });
        }
    }

    clickCanvas(evt) {
        if (this._clickMode === ClickMode.select) {
            let previousRegion = this.selectedRegion;
            _.forEachRight(this.boundRegions, region => {
                let rectangle = region.rectangle;
                if (this._isSelectionWithinBox(rectangle, this._toActualSize(evt.offsetX), this._toActualSize(evt.offsetY))) {
                    if (_.get(previousRegion, 'rectangle') === rectangle) {
                        return true;
                    }
                    this.eventAggregator.publish(EventNames.SELECTION_CHANGED, region);
                    return false;
                }
            });
            if (!this.selectedRegion && previousRegion) {
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
            this._lastCoords = _.clone(this._boxStart);
        } else if (this._clickMode === ClickMode.select && this.selectedRegion) {
            let cursor = $(this.element).css('cursor');
            if (cursor.match(/-resize/)) {
                this._clickMode = ClickMode.resize;
                this.resizingRegion = _.clone(this.selectedRegion);
                this._handleResizePositionByCursor(this.resizingRegion, evt.offsetX, evt.offsetY, cursor);
            }
        }
    }

    mouseWheel($event) {
        if ($event.ctrlKey && Math.abs($event.wheelDelta) > 100) {
            this._zoomDebounced($event.wheelDelta);
            return false;
        }
        return true;
    }

    mouseMoveCanvas(evt) {
        if (this._clickMode === ClickMode.select && this.selectedRegion) {
            let cursor = 'default';
            cursor = this._getPointerByPosition(this.selectedRegion.rectangle, evt.offsetX, evt.offsetY);
            _.defer(() => {
                $(this.element).css('cursor', cursor);
            });
        }
        else if (this._clickMode === ClickMode.box && this._boxStart) {
            if(this._isSelectionWithin(this._lastCoords.x, this._lastCoords.y, evt.offsetX, evt.offsetY, 3)) {
                return;
            }
            this.paint(this.image);
            _.defer(() => {
                if (!this._boxStart) {
                    return;
                }
                let ctx = this._getContext();
                ctx.strokeStyle = this.style.create;
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = this.LINE_WIDTH;
                ctx.strokeRect(this._boxStart.x, this._boxStart.y,
                    evt.offsetX - this._boxStart.x, evt.offsetY - this._boxStart.y);
                ctx.setLineDash([]);
                this._lastCoords = {x :evt.offsetX, y: evt.offsetY};
            });
        } else if (this._clickMode === ClickMode.resize) {
            if(this._isSelectionWithin(this._lastCoords.x, this._lastCoords.y, evt.offsetX, evt.offsetY, 2)) {
                return;
            }
            this.paint(this.image);
            _.defer(() => {
                if (!this.resizingRegion) {
                    return;
                }
                let ctx = this._getContext();
                ctx.strokeStyle = this.style.create;
                ctx.setLineDash([5, 5]);
                ctx.lineWidth = this.LINE_WIDTH;
                let rectangle = _.get(this.resizingRegion, 'rectangle');
                let x = this._toScaledSize(rectangle.x);
                let y = this._toScaledSize(rectangle.y);
                let w = this._toScaledSize(rectangle.width);
                let h = this._toScaledSize(rectangle.height);
                ctx.strokeRect(x, y,
                    (this.resizingRegion.allowResizeX ? evt.offsetX - x : w),
                    (this.resizingRegion.allowResizeY ? evt.offsetY - y : h));
                ctx.setLineDash([]);
                this._lastCoords = {x :evt.offsetX, y: evt.offsetY};
            });
        }
    }



    mouseUpCanvas(evt) {
        if (this._clickMode === ClickMode.resize) {
            let rectangle = this._getResizedRectangle(_.get(this.resizingRegion, 'rectangle'), evt.offsetX, evt.offsetY,
                _.get(this.resizingRegion, 'allowResizeX', true), _.get(this.resizingRegion, 'allowResizeY', true));
            this.selectedRegion.rectangle = rectangle;
            this.selectedRegion.image = this._generateCropImage(rectangle);
            _.defer(() => {
                this.repaint();
                this._clickMode = ClickMode.select;
            });
        }
        if (this._clickMode === ClickMode.box && this._boxStart) {
            this.repaintDebounced();
            let rectangle = this._getCreatedRectangle(this._boxStart, evt.offsetX, evt.offsetY);
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

    _zoom(wheelDelta) {
        this.eventAggregator.publish(EventNames.ZOOM, Math.sign(wheelDelta));
    }

    _toActualSize(v) {
        return v / this.scalingFactor;
    }

    _toScaledSize(v) {
        return v * this.scalingFactor;
    }

    /**
     * Will examine the cursor position against the original origin for the cursor and if needed
     * re-set the starting cursor position.  If will also fix the vertical/horizontal resizing of the
     * region if needed.
     *
     * @param region
     * @param e_x
     * @param e_y
     * @param cursor
     * @private
     */
    _handleResizePositionByCursor(region, e_x, e_y, cursor) {
        region.allowResizeX = true;
        region.allowResizeY = true;
        switch(cursor) {
            case 'ns-resize':
                region.allowResizeX = false;
                let y = this._toScaledSize(_.get(region, 'rectangle.y'));
                if (this._isSelectionWithin(0, y, 0, e_y, this._threshold)) {
                    _.set(region, 'rectangle.y', this._toActualSize(y) + _.get(region, 'rectangle.height'));
                }
                break;
            case 'ew-resize':
                region.allowResizeY = false;
                let x = this._toScaledSize(_.get(region, 'rectangle.x'));
                if (this._isSelectionWithin(x, 0, e_x, 0, this._threshold)) {
                    _.set(region, 'rectangle.x', this._toActualSize(x) + _.get(region, 'rectangle.width'));
                }
                break;
            case 'nesw-resize':
                x = _.get(region, 'rectangle.x');
                let w = _.get(region, 'rectangle.width');
                if (this._isSelectionWithin( this._toScaledSize(x) + this._toScaledSize(w), 0, e_x, 0, this._threshold)) {
                    _.set(region, 'rectangle.y', _.get(region, 'rectangle.y') + _.get(region, 'rectangle.height'));
                } else if (this._isSelectionWithin( this._toScaledSize(x), 0, e_x, 0, this._threshold)) {
                    _.set(region, 'rectangle.x', x + w);
                }
                break;
            case 'nwse-resize':
                x = _.get(region, 'rectangle.x');
                w = _.get(region, 'rectangle.width');
                if (this._isSelectionWithin( this._toScaledSize(x), 0, e_x, 0, this._threshold)) {
                    _.set(region, 'rectangle.x', x + w);
                    _.set(region, 'rectangle.y', _.get(region, 'rectangle.y') + _.get(region, 'rectangle.height'));
                }
                break;
        }
    }

    /**
     * Create an actual box from the original starting location and the width/height as designated by the positional
     * coordinates.  If the
     *
     * @param rectangle
     * @param e_x
     * @param e_y
     * @private
     */
    _getCreatedRectangle(rectangle, e_x, e_y) {
        let x = rectangle.x;
        let y = rectangle.y;
        let w = e_x - this._toScaledSize(rectangle.x);
        let h = e_y - this._toScaledSize(rectangle.y);
        if (w < 0) {
            x = e_x;
        }
        if (h < 0) {
            y = e_y;
        }
        let rect = {
            x:      this._toActualSize(x),
            y:      this._toActualSize(y),
            width:  this._toActualSize(Math.abs(w)),
            height: this._toActualSize(Math.abs(h))
        };
        return rect;
    }


    _getResizedRectangle(rectangle, e_x, e_y, allowResizeX, allowResizeY) {
        let x = this._toScaledSize(rectangle.x);
        let y = this._toScaledSize(rectangle.y);
        let w = allowResizeX ? (e_x - x) : this._toScaledSize(rectangle.width);
        let h = allowResizeY ?(e_y - y) : this._toScaledSize(rectangle.height);
        if (w < 0) {
            x += w;
        }
        if (h < 0) {
            y += h;
        }
        let rect = {
            x:      this._toActualSize(x),
            y:      this._toActualSize(y),
            width:  this._toActualSize(Math.abs(w)),
            height: this._toActualSize(Math.abs(h))
        };
        return rect;
    }

    _getPointerByPosition(rectangle, x, y) {
        let cursor = 'default';
        let cr = this._threshold;
        let rx = this._toScaledSize(rectangle.x);
        let ry = this._toScaledSize(rectangle.y);
        let rw = this._toScaledSize(rectangle.width);
        let rh = this._toScaledSize(rectangle.height);
        if (this._isSelectionWithin(rx + rw, ry + rh, x, y, cr) || this._isSelectionWithin(rx, ry, x, y, cr)) {
            cursor = 'nwse-resize';
        } else if (this._isSelectionWithin(rx + rw, ry, x, y, cr) || this._isSelectionWithin(rx, ry + rh, x, y, cr)) {
            cursor = 'nesw-resize';
        } else if ((this._isSelectionWithin(0, ry + rh, 0, y, cr) || this._isSelectionWithin(0, ry, 0, y, cr)) && x + cr >= rx && x <= rx + rw - cr) {
            cursor = 'ns-resize';
        } else if ((this._isSelectionWithin(rx, 0, x, 0, cr) || this._isSelectionWithin(rx + rw, 0, x, 0, cr))
            && (y >= ry + cr) && (y <= ry + rh - cr)) {
            cursor = 'ew-resize';
        }
        return cursor;
    }

    _isSelectionWithin(previousX, previousY, currentX, currentY, threshold = 2) {
        return Math.abs(currentX - previousX) <= threshold && Math.abs(currentY - previousY) <= threshold;
    }

    _isSelectionWithinBox(rectangle, x, y) {
        return ( rectangle.x < x && rectangle.x + rectangle.width > x && rectangle.y < y && rectangle.y + rectangle.height > y);
    }

    _isNearSelectionEdge(rectangle, x, y) {
        let delta = 10;
        return ((((x > rectangle.x - delta) && (x < rectangle.x + delta)) ||
                ((x > rectangle.x + rectangle.width - delta) && (x < rectangle.x + rectangle.width + delta))) &&
            (((y > rectangle.y - delta) && (y < rectangle.y + delta)) ||
                ((y > rectangle.y + rectangle.height - delta) && (y < rectangle.y + rectangle.height + delta)))
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
        if (!_.isNil(this._image, 'src')) {
            URL.revokeObjectURL(this._image.src)
            this._image.src = '';
            this._image = null;
        }
    }

    clear() {
        let canvas = this._getCanvas();
        let ctx = this._getContext();
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.restore();
    }

    paint(newImage) {
        if (newImage) {
            let img = new Image();
            img.onload = () => {
                if( this.lastScalingFactor !== this.scalingFactor) {
                    let cvs = this._getCanvas();
                    // We need to set the HTML attributes of the Canvas vs. using CSS since the CSS properties are for the
                    // visible size only
                    cvs.attr('width', this._toScaledSize(img.width));
                    cvs.attr('height', this._toScaledSize(img.height));
                    this.lastScalingFactor = this.scalingFactor;
                }

                this._getContext().lineWidth = 1.0;
                this._getContext().drawImage(img, 0, 0, img.width, img.height, 0, 0,
                    this._toScaledSize(img.width), this._toScaledSize(img.height));
            }
            img.src = newImage;
            this._image = img;
        } else {
            let canvas = this._getCanvas();
            let ctx = this._getContext();
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, this._toActualSize($(canvas).width()), this._toActualSize($(canvas).height()));
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

    scalingFactorChanged() {
        this.scalingFactor = this.scalingFactor || 1.0
        this.repaintDebounced();
    }

    regionsChanged() {
        if (this.boundRegions) {
            this.repaint();
            _.defer(() => {
                _.forEach(this.boundRegions, (region) => {
                    if(!region.image) {
                        region.image = this._generateCropImage(region.rectangle);
                    }
                });
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
        let isSelected = (rect === _.get(this.selectedRegion, 'rectangle'));
        ctx.lineWidth = isSelected ? this.SELECTED_LINE_WIDTH: this.LINE_WIDTH;
        ctx.strokeStyle = isSelected ? this.style.selected : this.style.border;
        ctx.strokeRect(this._toScaledSize(rect.x), this._toScaledSize(rect.y),
            this._toScaledSize(rect.width), this._toScaledSize(rect.height));

        if (isSelected) {
            ctx.globalAlpha = this.style.transparency;
            ctx.fillStyle = this.style.selected;
            ctx.fillRect(this._toScaledSize(rect.x ), this._toScaledSize(rect.y),
                this._toScaledSize(rect.width), this._toScaledSize(rect.height));
            ctx.globalAlpha = 1.0; // revert
        }

        let fontSize = (this.scalingFactor < 0.5) ? '11px': '14px';
        ctx.font = `${fontSize} arial`;
        ctx.lineWidth = 1;
        ctx.fillStyle = isSelected ? this.style.selected : this.style.border;
        ctx.fillText(text, this._toScaledSize(rect.x) + 5, this._toScaledSize(rect.y) + 15);
    }

    /**
     *
     * @param newImage - the BLOB or Data String representing an image
     */
    imageChanged(newImage) {
        this._cleanupImage();
        this.clear();
        this.paint(undefined);
        this.paint(newImage);
        this.generateOffScreenCanvas(newImage);
    }

}

class ClickMode {

    static box = 'rectangle';
    static select = 'select';
    static resize = 'resize';
}
