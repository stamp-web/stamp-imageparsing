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

export const ImageTypes = ['png', 'jpg', 'tiff'];
export const TIFFCompression = ['lzw', 'jpeg', 'deflate'];

export const DefaultOptions = {
    image:       {
        defaultType: ImageTypes[1]
    },
    dpi:         {
        mode:       'image',
        horizontal: 300,
        vertical:   300
    },
    jpeg:        {
        quality: 85
    },
    tiff:        {
        compression: TIFFCompression[1]
    },
    boundingBox: {
        padding:                 20,
        minimumBoundingArea:     10000,
        excludeMaximumArea:      false,
        maximumBoundingArea:     0.85,
        minimumInterceptingArea: 0.25
    },
    processing:  {
        dilationCount: 2
    }
};

export const KeyCodes = {
    TAB:             9,
    DEL:             46,
    KEY_N:           78,
    KEY_O:           79,
    Key_P:           80,
    NUMPAD_ADD:      107,
    NUMPAD_SUBTRACT: 109,
    EQUAL:           187,
    MINUS:           189
}

export const EventNames = {
    ADD_REGION:        'add-rectangle',
    FILE_OPEN:         'file_open',
    FOLDER_SELECTED:   'folder-selected',
    NEW_REGION:        'new-image-bounds',
    REMOTE_MESSAGING:  'remote-messaging',
    SAVE_REGIONS:      'save-regions',
    SAVE_SETTINGS:     'save-settings',
    SELECTION_CHANGED: 'selection-changed',
    STATUS_MESSAGE:    'status-message'
};

export const StorageKeys = {
    OPTIONS:     'options',
    OUTPUT_PATH: 'output-path',
    SERVER_INFO: 'server-info'
}

export const ChannelNames = {
    MEMORY_STATS: '/data/memory-stats'
};

export const PublishAPI = {
    MEMORY_STATS: '/api/svc/memory-info'
};
