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


import {AltPaths} from 'manager/alt-paths';
import {StorageKeys} from 'util/constants';
import _ from 'lodash';
import {createSpyObj} from 'jest-createspyobj';

describe('AltPaths', () => {
    let altPaths;

    beforeEach(() => {
        altPaths = new AltPaths();
        altPaths.reset();
    });

    describe('reset', () => {
        it('verify value is reset', () => {
            localStorage.setItem(StorageKeys.ALTERNATE_PATHS, JSON.stringify(['test']));
            expect(localStorage.getItem(StorageKeys.ALTERNATE_PATHS)).toBe(JSON.stringify(['test']));
            altPaths.reset();
            expect(localStorage.getItem(StorageKeys.ALTERNATE_PATHS)).toBeNull();
        });
    });

    describe('save', () => {
        it('verify save places it in local storage', () => {
            altPaths.reset();
            altPaths.paths = ['test', 'test2'];
            altPaths.save();
            expect(localStorage.getItem(StorageKeys.ALTERNATE_PATHS)).toBe(JSON.stringify(altPaths.paths));
        });
    });

    describe('_ensureLoaded', () => {

        it('verify loaded', () => {
           altPaths.loaded = false;
           let paths = ['unit', 'Resource'];
           localStorage.setItem(StorageKeys.ALTERNATE_PATHS, JSON.stringify(paths));
           altPaths._ensureLoaded();
           expect(_.size(altPaths.paths)).toBe(2);
        });

        it('do not load if loaded', () => {
            altPaths.loaded = true;
            // need to set it on the prototype
            jest.spyOn(window.localStorage.__proto__, 'getItem');
            altPaths._ensureLoaded();
            expect(window.localStorage.getItem).not.toHaveBeenCalled();
        });
    });

    describe('set/get paths', () => {
       it('verify path setting', () => {
          altPaths.loaded = true;
          let paths = ['test', 'unit'];
          let s_paths = JSON.stringify(paths);
          altPaths.setPaths(paths);
          expect(_.size(altPaths.paths)).toBe(2);
          let newPaths = altPaths.getPaths();
          expect(_.size(newPaths)).toBe(2);
          expect(JSON.stringify(newPaths)).toBe(s_paths);

       });
    });
});
