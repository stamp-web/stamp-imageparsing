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
import {ImageCanvas} from 'resources/elements/image/image-canvas';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BindingEngine} from 'aurelia-framework';

describe('ImageCanvas', () => {

    let imageCanvas;

    let elementSpy = jasmine.createSpy('element');
    let eventAggregatorSpy = jasmine.createSpy('eventAggregator');
    let bindingEngineSpy = jasmine.createSpy('bindingEngine');

    beforeEach(() => {
        imageCanvas = new ImageCanvas(elementSpy, eventAggregatorSpy, bindingEngineSpy);
    });

    describe('_isSelectionWithin', () => {
        it('validate by x within', () => {
            expect(imageCanvas._isSelectionWithin(0, 0, 4, 0, 5)).toBe(true);
            expect(imageCanvas._isSelectionWithin(5, 0, 1, 0, 5)).toBe(true);
            expect(imageCanvas._isSelectionWithin(5, 0, 0, 0, 5)).toBe(true);
            expect(imageCanvas._isSelectionWithin(5, 0, 5, 0, 5)).toBe(true);
        });

        it('validate by x without', () => {
            expect(imageCanvas._isSelectionWithin(0, 0, 15, 0, 5)).toBe(false);
            expect(imageCanvas._isSelectionWithin(0, 0, -15, 0, 5)).toBe(false);
            expect(imageCanvas._isSelectionWithin(15, 0, 0, 0, 5)).toBe(false);
            expect(imageCanvas._isSelectionWithin(-15, 0, 0, 0, 5)).toBe(false);
        });

        it('validate by y within', () => {
            expect(imageCanvas._isSelectionWithin(0, 0, 0, 4, 5)).toBe(true);
            expect(imageCanvas._isSelectionWithin(0, 5, 0, 1, 5)).toBe(true);
            expect(imageCanvas._isSelectionWithin(0, 5, 0, 0, 5)).toBe(true);
            expect(imageCanvas._isSelectionWithin(0, 5, 0, 5, 5)).toBe(true);
        });

        it('validate by y without', () => {
            expect(imageCanvas._isSelectionWithin(0, 0, 0, 15, 5)).toBe(false);
            expect(imageCanvas._isSelectionWithin(0, 0, 0, -15, 5)).toBe(false);
            expect(imageCanvas._isSelectionWithin(0, 15, 0, 0, 5)).toBe(false);
            expect(imageCanvas._isSelectionWithin(0, -15, 0, 0, 5)).toBe(false);
        });
    });

    describe('_getCreatedRectangle', () => {
        it('create SE rectangle', () => {
            let rect = {
                x:      50,
                y:      30,
                width:  10, // just to verify not used
                height: 10 // just to verify not used
            };
            let rectangle = imageCanvas._getCreatedRectangle(rect, 200, 180);
            expect(rectangle.x).toBe(50);
            expect(rectangle.y).toBe(30);
            expect(rectangle.width).toBe(150);
            expect(rectangle.height).toBe(150);
        });

        it('create NW rectangle', () => {
            let rect = {
                x:      100,
                y:      150,
                width:  10, // just to verify not used
                height: 10 // just to verify not used
            };
            let rectangle = imageCanvas._getCreatedRectangle(rect, 20, 100);
            expect(rectangle.x).toBe(20);
            expect(rectangle.y).toBe(100);
            expect(rectangle.width).toBe(80);
            expect(rectangle.height).toBe(50);
        });
    });

    describe('_getResizedRectangle', () => {
       it('resized SE', () => {
           let rect = {
               x:      50,
               y:      60,
               width:  20,
               height: 30
           };
           let rectangle = imageCanvas._getResizedRectangle(rect, 100, 120, true, true);
           expect(rectangle.x).toBe(50);
           expect(rectangle.y).toBe(60);
           expect(rectangle.width).toBe(50);
           expect(rectangle.height).toBe(60);
       });

        it('resized E', () => {
            let rect = {
                x:      50,
                y:      60,
                width:  20,
                height: 30
            };
            let rectangle = imageCanvas._getResizedRectangle(rect, 100, 120, true, false);
            expect(rectangle.x).toBe(50);
            expect(rectangle.y).toBe(60);
            expect(rectangle.width).toBe(50);
            expect(rectangle.height).toBe(30);
        });

        it('resized S', () => {
            let rect = {
                x:      50,
                y:      60,
                width:  20,
                height: 30
            };
            let rectangle = imageCanvas._getResizedRectangle(rect, 100, 120, false, true);
            expect(rectangle.x).toBe(50);
            expect(rectangle.y).toBe(60);
            expect(rectangle.width).toBe(20);
            expect(rectangle.height).toBe(60);
        });

        it('resized NW', () => {
            let rect = {
                x:      80,
                y:      90,
                width:  20,
                height: 30
            };
            let rectangle = imageCanvas._getResizedRectangle(rect, 50, 50, true, true);
            expect(rectangle.x).toBe(50);
            expect(rectangle.y).toBe(50);
            expect(rectangle.width).toBe(30);
            expect(rectangle.height).toBe(40);
        });

        it('resized SE scaled at 0.5', () => {
            let rect = {
                x:      50,
                y:      50,
                width:  20,
                height: 20
            };
            imageCanvas.scalingFactor = 0.5;
            let rectangle = imageCanvas._getResizedRectangle(rect, 100, 100, true, true);
            expect(rectangle.x).toBe(50);
            expect(rectangle.y).toBe(50);
            expect(rectangle.width).toBe(150);
            expect(rectangle.height).toBe(150);
        });
    });

    describe('_getPointerByPosition', () => {
       it('not anywhere near', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 600, 600)).toBe('default');
           expect(imageCanvas._getPointerByPosition(rect, 0, 75)).toBe('default');
           expect(imageCanvas._getPointerByPosition(rect, 600, 75)).toBe('default');
           expect(imageCanvas._getPointerByPosition(rect, 75, 600)).toBe('default');
           expect(imageCanvas._getPointerByPosition(rect, 75, 0)).toBe('default');
       });

        it('near top left corner', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 45, 50)).toBe('nwse-resize');
            expect(imageCanvas._getPointerByPosition(rect, 52, 52)).toBe('nwse-resize');
            expect(imageCanvas._getPointerByPosition(rect, 45, 45)).toBe('nwse-resize');
            expect(imageCanvas._getPointerByPosition(rect, 55, 55)).toBe('nwse-resize');
        });

        it('near bottom right corner', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 145, 150)).toBe('nwse-resize');
            expect(imageCanvas._getPointerByPosition(rect, 152, 152)).toBe('nwse-resize');
            expect(imageCanvas._getPointerByPosition(rect, 145, 145)).toBe('nwse-resize');
            expect(imageCanvas._getPointerByPosition(rect, 155, 155)).toBe('nwse-resize');
        });

        it('near top right corner', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 145, 50)).toBe('nesw-resize');
            expect(imageCanvas._getPointerByPosition(rect, 152, 52)).toBe('nesw-resize');
            expect(imageCanvas._getPointerByPosition(rect, 145, 45)).toBe('nesw-resize');
            expect(imageCanvas._getPointerByPosition(rect, 155, 55)).toBe('nesw-resize');
        });

        it('near bottom left corner', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 45, 150)).toBe('nesw-resize');
            expect(imageCanvas._getPointerByPosition(rect, 52, 152)).toBe('nesw-resize');
            expect(imageCanvas._getPointerByPosition(rect, 45, 145)).toBe('nesw-resize');
            expect(imageCanvas._getPointerByPosition(rect, 55, 155)).toBe('nesw-resize');
        });

        it('along right edge', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 145, 100)).toBe('ew-resize');
            expect(imageCanvas._getPointerByPosition(rect, 152, 102)).toBe('ew-resize');
            expect(imageCanvas._getPointerByPosition(rect, 145, 144)).toBe('ew-resize');
            expect(imageCanvas._getPointerByPosition(rect, 155, 56)).toBe('ew-resize');
        });

        it('along top edge', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 100, 45)).toBe('ns-resize');
            expect(imageCanvas._getPointerByPosition(rect, 102, 52)).toBe('ns-resize');
            expect(imageCanvas._getPointerByPosition(rect, 56, 45)).toBe('ns-resize');
            expect(imageCanvas._getPointerByPosition(rect, 144, 55)).toBe('ns-resize');
        });

        it('along bottom edge', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 144, 150)).toBe('ns-resize');
            expect(imageCanvas._getPointerByPosition(rect, 56, 152)).toBe('ns-resize');
            expect(imageCanvas._getPointerByPosition(rect, 105, 154)).toBe('ns-resize');
            expect(imageCanvas._getPointerByPosition(rect, 144, 145)).toBe('ns-resize');
        });

        it('along left edge', () => {
            let rect = { x: 50, y: 50, width: 100, height: 100 };
            expect(imageCanvas._getPointerByPosition(rect, 46, 100)).toBe('ew-resize');
            expect(imageCanvas._getPointerByPosition(rect, 52, 56)).toBe('ew-resize');
            expect(imageCanvas._getPointerByPosition(rect, 50, 100)).toBe('ew-resize');
            expect(imageCanvas._getPointerByPosition(rect, 45, 144)).toBe('ew-resize');
        });
    });

    describe('_handleResizePositionByCursor', () => {
        let rect;
        let region;

        beforeEach(() => {
            rect = { x: 50, y: 20, width: 100, height: 120};
            region = {
                allowResizeY: true,
                allowResizeX: true,
                rectangle: rect

            };
        });

       it('from left edge', () => {
           imageCanvas._handleResizePositionByCursor(region, 48, 25, 'ew-resize');
           expect(region.rectangle.x).toBe(150);
           expect(region.rectangle.y).toBe(20);
           expect(region.allowResizeY).toBe(false);
           expect(region.allowResizeX).toBe(true);
       });

        it('from top edge', () => {
            imageCanvas._handleResizePositionByCursor(region, 60, 18, 'ns-resize');
            expect(region.rectangle.x).toBe(50);
            expect(region.rectangle.y).toBe(140);
            expect(region.allowResizeY).toBe(true);
            expect(region.allowResizeX).toBe(false);
        });

        it('from top right corner', () => {
            imageCanvas._handleResizePositionByCursor(region, 150, 20, 'nesw-resize');
            expect(region.rectangle.x).toBe(50);
            expect(region.rectangle.y).toBe(140);
            expect(region.allowResizeY).toBe(true);
            expect(region.allowResizeX).toBe(true);
        });

        it('from top left corner', () => {
            imageCanvas._handleResizePositionByCursor(region, 50, 20, 'nwse-resize');
            expect(region.rectangle.x).toBe(150);
            expect(region.rectangle.y).toBe(140);
            expect(region.allowResizeY).toBe(true);
            expect(region.allowResizeX).toBe(true);
        });

        it('from bottom right corner', () => {
            imageCanvas._handleResizePositionByCursor(region, 150, 140, 'nwse-resize');
            expect(region.rectangle.x).toBe(50);
            expect(region.rectangle.y).toBe(20);
            expect(region.allowResizeY).toBe(true);
            expect(region.allowResizeX).toBe(true);
        });

        it('from bottom left corner', () => {
            imageCanvas._handleResizePositionByCursor(region, 50, 140, 'nesw-resize');
            expect(region.rectangle.x).toBe(150);
            expect(region.rectangle.y).toBe(20);
            expect(region.allowResizeY).toBe(true);
            expect(region.allowResizeX).toBe(true);
        })
    });

});
