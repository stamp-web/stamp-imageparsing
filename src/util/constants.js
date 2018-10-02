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

export const DefaultOptions = {
    dpi:  {
        mode:       'image',
        horizontal: 300,
        vertical:   300
    },
    jpeg: {
        quality: 85
    }
};

export const EventNames = {
    SAVE_REGIONS: 'save-regions',
    SAVE_SETTINGS: 'save-settings',
    SELECTION_CHANGED: 'selection-changed'
};

export const StorageKeys = {
    OPTIONS: 'options',
    OUTPUT_PATH: 'output-path'
}
