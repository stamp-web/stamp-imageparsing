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
import {StringListView} from 'resources/elements/components/string-list-view';
import _ from 'lodash';

describe('StringListView', () => {

    let stringListView;
    let element = {};

    beforeEach(() => {
        stringListView = new StringListView(element);
    });

    describe('addText', () => {
        it('items contain text and add text is cleared', () => {
            stringListView.items = ['a', 'b'];
            stringListView.addText = 'c';
            stringListView.add('c');
            expect(_.size(stringListView.items)).toBe(3);
            expect(stringListView.addText).toBe('');
        });
    });

    describe('selectRow', () => {
        it('verify row is selected', () => {
            stringListView.selected = -1;
            stringListView.items = ['test'];
            stringListView.selectRow(0);
            expect(stringListView.selected).toBe(0);
        });
    })

    describe('invalid', () => {
        it('invalid when addText is empty', () => {
            stringListView.items = ['test'];
            expect(stringListView.invalid).toBe(true);
        });

        it('invalid when addText is not empty and text matches item', () => {
            stringListView.items = ['test'];
            stringListView.addText = 'test';
            expect(stringListView.invalid).toBe(true);
        });

        it('valid when addText is not empty and text does not matches item', () => {
            stringListView.items = ['test'];
            stringListView.addText = 'test2';
            expect(stringListView.invalid).toBe(false);
        });
    });

    describe('remove', () => {
       it('remove item that is selected', () => {
           stringListView.items = ['a', 'b'];
           stringListView.selected = 1;
           stringListView.remove(1);
           expect(stringListView.selected).toBe(-1);
           expect(_.size(stringListView.items)).toBe(1);
           expect(_.first(stringListView.items)).toBe('a');
       });
    });

    describe('move', () => {
        it('move up at first item', () => {
            stringListView.items = ['a', 'b'];
            stringListView.selected = 0;
            stringListView.move(0, -1);
            expect(stringListView.selected).toBe(0);
            expect(_.first(stringListView.items)).toBe('a');
        });

        it('move down at last item', () => {
            stringListView.items = ['a', 'b'];
            stringListView.selected = 1;
            stringListView.move(1, 1);
            expect(stringListView.selected).toBe(1);
            expect(_.last(stringListView.items)).toBe('b');
        });

        it('move down at first item', (done) => {
            stringListView.items = ['a', 'b'];
            stringListView.selected = 0;
            stringListView.move(0, 1);
            _.defer(() => {
                expect(stringListView.selected).toBe(1);
                expect(_.last(stringListView.items)).toBe('a');
                done();
            });

        });

        it('move up at last item', (done) => {
            stringListView.items = ['a', 'b'];
            stringListView.selected = 1;
            stringListView.move(1, -1);
            _.defer(() => {
                expect(stringListView.selected).toBe(0);
                expect(_.first(stringListView.items)).toBe('b');
                done();
            });

        });
    });
});
