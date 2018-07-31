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
import {customElement, bindable} from 'aurelia-framework';
import $ from 'jquery';
import _ from 'lodash';

@customElement('image-canvas')
export class ImageCanvas {

    static inject = [Element];

    _ctx;   // 2d canvas context
    _image; // HTMLImageElement

    @bindable image;
    @bindable imageBounds = [];
    @bindable scalingFactor = 1.0;


    constructor(element) {
        this.element = element;
    }

    attached( ) {
        this.clear();
    }

    detached( ) {
       this._cleanupImage();
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
        ctx.fillRect(0,0, canvas.width, canvas.height);
    }

    paint(newImage) {
        if (newImage) {
            let img = new Image();
            img.onload = () => {
                let cvs = this._getCanvas();
                // We need to set the HTML attributes of the Canvas vs. using CSS since the CSS properties are for the
                // visible size only
                cvs.attr('width', img.width * this.scalingFactor);
                cvs.attr('height', img.height * this.scalingFactor);
                this._getContext().drawImage(img, 0, 0, img.width, img.height, 0, 0,
                    img.width * this.scalingFactor, img.height * this.scalingFactor);
            }
            img.src = newImage;
            this._image = img;
        }
    }

    scalingFactorChanged(newFactor) {
        this.paint(this.image);
        this.imageBoundsChanged(this.imageBounds);
        _.defer(() => {

        });

    }

    imageBoundsChanged(newRects) {
        if (newRects) {
            let ctx = this._getContext();
            ctx.strokeStyle = '#22cc22';
            _.forEach(newRects, rect => {
                ctx.strokeRect(rect.x * this.scalingFactor, rect.y * this.scalingFactor,
                    rect.width * this.scalingFactor, rect.height * this.scalingFactor);
            });
            this.imageBounds = newRects;
        }
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
