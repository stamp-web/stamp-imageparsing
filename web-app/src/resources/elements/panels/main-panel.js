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

import {customElement, computedFrom, inject, bindable, observable, LogManager} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {I18N} from 'aurelia-i18n';
import {Router} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {changeDpiDataUrl} from 'changedpi';
import {FileManager} from 'manager/file-manager';
import {ImageHandler} from 'processing/image/image-handler';
import {ImageBounds} from 'model/image-bounds';
import {DefaultOptions, EventNames, StorageKeys, ImageTypes, KeyCodes, ChannelNames} from 'util/constants';
import _ from 'lodash';
import {ConnectionManager} from 'manager/connection-manager';
import {DuplicateResolveDialog} from "../dialogs/duplicate-resolve-dialog";

const ZOOM_IN = 1;
const ZOOM_OUT = -1;

const MAX_ZOOM = 4.0;
const MIN_ZOOM = 0.125;

@customElement('main-panel')
@inject(Element, I18N, Router, ImageHandler, EventAggregator, FileManager, ConnectionManager, DialogService)
export class MainPanel {

    @observable boxes = [];
    @bindable boundRegions = [];
    @bindable selectedRegion;
    @observable selectedFile;

    toobig = false;
    toosmall = false;

    scalingFactor = 1.0;

    data;
    dataURI;
    image;

    outputPath;
    processing = false;
    folders = [];

    showSettings = false;
    fileInputName = 'file-input-name';
    connected = false;

    subscribers = [];
    memoryStats = [];

    tiffMetaType;

    constructor(element, i18n, router, imageHandler, eventAggregator, fileManager, connectionManager, dialogService) {
        this.element = element;
        this.i18n = i18n;
        this.router = router;
        this.handler = imageHandler;
        this.eventAggregator = eventAggregator;
        this.logger = LogManager.getLogger('main-panel');
        this.fileManager = fileManager;
        this.connectionManager = connectionManager;
        this.dialogService = dialogService;
        this.setTiffMetaType();

    }

    setTiffMetaType() {
        this.fileManager.getMimeType('tiff').then(mime => {
            this.tiffMetaType = mime;
            ;
        });
    }

    attached() {
        this._setupListeners();
        this.options = _.assign({}, DefaultOptions);
        let opts = localStorage.getItem(StorageKeys.OPTIONS);
        if (!_.isNil(opts)) {
            this.options = _.assign(this.options, JSON.parse(opts));
        }
        let folder = localStorage.getItem(StorageKeys.OUTPUT_PATH);
        if (!_.isNil(folder)) {
            this._handleFolderSelected(folder);
        }

        this._startPing();
    }

    detached() {
        $(this.element).off('keydown');
        _.forEach(this.subscribers, sub => {
            sub.dispose();
        });
    }

    home() {
        this.router.navigateToRoute('welcome');
    }

    _startPing() {
        let f = () => {
            this.connected = this.connectionManager.isConnected();
            _.delay(f, 2000);
        }
        f();
    }

    _setupListeners() {
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.SELECTION_CHANGED, this._handleSelectionChange.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.NEW_REGION, this._handleNewRegion.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.SAVE_REGIONS, this._handleSaveRegions.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.SAVE_SETTINGS, this._handleSaveSettings.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.FOLDER_SELECTED, this._handleFolderSelected.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.DUPLICATE_DETECTION, this._handleDuplicates.bind(this)));
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.ZOOM, this.zoom.bind(this)));
        this.connectionManager.addSubscriber(ChannelNames.MEMORY_STATS, this._handleMemoryStats.bind(this));
        $(this.element).on('keydown', this._handleKeydown.bind(this));
    }

    _handleMemoryStats(response) {
        let stats = JSON.parse(_.get(response, 'body', "{}"));
        let freeMemory = _.get(stats, 'freeMemory', -1) * 1.0;
        let totalMemory = _.get(stats, 'totalMemory', -1) * 1.0;
        let used = freeMemory / totalMemory;
        let mem = _.takeRight(this.memoryStats, 9);
        mem.push(used);
        this.memoryStats = mem;
    }

    _handleDuplicates(event) {
        this.dialogService.open({
            viewModel: DuplicateResolveDialog,
            model: {
                duplicates: event.duplicates
            }
        }).then(dialogResult => {
            dialogResult.closeResult.then(result => {
                if(!result.wasCancelled) {
                    let duplicates = _.get(result, 'output');
                    this._handleSaveRegions(duplicates, 'process-duplicates',true);
                }

            });
        });
    }

    _handleKeydown(event) {
        if (event.ctrlKey) {
            if (this.image) {
                switch(event.keyCode) {
                    case KeyCodes.DEL:
                        let curIndex = this.getSelectedIndex();
                        this.deleteSelected();
                        if (!_.isEmpty(this.boundRegions)) {
                            this.selectedRegion = this.boundRegions[curIndex];
                        }
                        break;
                    case KeyCodes.NUMPAD_ADD:
                        this.zoom(ZOOM_IN);
                        break;
                    case KeyCodes.NUMPAD_SUBTRACT:
                        this.zoom(ZOOM_OUT);
                        break;
                    case KeyCodes.KEY_N:
                        this.addRegion();
                        break;
                    case KeyCodes.Key_P:
                        this.process();
                        break;
                }
            }
            if(event.keyCode === KeyCodes.KEY_O) {
                this.eventAggregator.publish(EventNames.FILE_OPEN, this.fileInputName);
            }
        }

    }

    _handleSaveSettings(settings) {
        this.options = _.merge(this.options, settings);
        localStorage.setItem(StorageKeys.OPTIONS, JSON.stringify(this.options));
    }

    _handleNewRegion(boundImage) {
        this._initializeRegion(boundImage);
        this.boundRegions.push(boundImage);
        this.selectedRegion = boundImage;
    }

    _handleSelectionChange(region) {
        this.selectedRegion = region;
    }

    _handleSaveRegions(regions, evt, overwriteImage = false) {
        if (!this.data) {
            this.fileManager.asFile(this.selectedFile).then(f => {
                this.handler.readImage(f, true).then(i_data => {
                    this.data = i_data.data;
                    this._saveRegions(this.data, regions, this.options, overwriteImage);
                });
            });
        } else {
            this.logger.debug('Using cached data of the image');
            this._saveRegions(this.data, regions, this.options, overwriteImage);
        }
    }

    _saveRegions(data, regions, options, overwriteImage = false) {
        this.handler.saveRegions(data, regions, options, overwriteImage).then(() => {
            _.forEach(_.filter(regions, {saved: true}), result => {
                let match = _.find(this.boundRegions, ImageBounds.getMatcher(result));
                if (match) {
                    _.assign(match, result);
                    _.unset(match, 'overwrite');
                    _.unset(match, 'exists');
                }
            });
        }).catch(e => {
            this.logger.warn(e);
        });

    }

    _handleFolderSelected(folderPath) {
        this.outputPath = folderPath;
        this.fileManager.getFolders(this.outputPath).then(folders => {
            this.folders = [];
            _.defer(() => { // tickle the property update on the array
                this.folders = [{name: this.i18n.tr('placeholders.currentFolder'), path: folderPath}];
                if (folders.length > 0) {
                    this.folders = this.folders.concat(folders);
                }
            });
        });
    }

    boxesChanged() {
        this.selectedRegion = undefined;
        _.defer(() => {
            _.forEach(this.boxes, (box, index) => {
                let region = new ImageBounds({
                    rectangle: box
                });
                this._initializeRegion(region);
                this.boundRegions.push(region);
                if (index === 0) {
                    this.selectedRegion = region;
                }
            });
        });
    }

    _initializeRegion(region) {
        _.set(region, 'imageType', _.get(this.options, 'image.defaultType', _.first(ImageTypes)));
    }

    selectedFileChanged() {
        this.clear();
        if (this.selectedFile) {
            this.fileManager.asFile(this.selectedFile).then(f => {
                this._processFile(f);
            });
        }
    }

    /**
     * User has the option to open up image to fit screen or to use the last zoom setting.  This is determined
     * by a global setting.
     */
    setScalingFactor(img) {
        if (this.dataURI) {
            if(!img) {
                img = new Image();
            }
            img.onload = () => {
                if (_.get(this.options, 'image.fitImageToWindow', false) && this.imageCanvas) {
                    this.scalingFactor = this.getScalingFactorFromImage(this.imageCanvas, img);
                }
            }
            img.src = this.dataURI;
        }
    }

    /**
     * Retrieve the closest scaling factor based on the image width or height relative to the
     * canvas offsetWidth or offsetHeight.  The smaller ratio will be used for comparison.  The final scaling
     * factor must match one of the predefined scaling factors or will be set to 1.0 (equivalent to 100% zoom)
     *
     * NOTE: This should be called after the image is loaded to ensure the dimensions are present
     *
     * @param elm   The on screen element to size to
     * @param img   The image used for calculation of sizing
     *
     * @returns {number}
     */
    getScalingFactorFromImage(elm, img) {
        let scaleFactor = 1.0;
        if ((elm.offsetWidth / img.width) < (elm.offsetHeight / img.height)) {
            scaleFactor = Math.min(elm.offsetWidth / img.width, 1.0);
        } else {
            scaleFactor = Math.min(elm.offsetHeight / img.height, 1.0);
        }

        if (scaleFactor < 0.25) {
            scaleFactor = 0.125;
        } else if (scaleFactor < 0.5) {
            scaleFactor = 0.25;
        } else if (scaleFactor < 1.0) {
            scaleFactor = 0.5;
        }
        return scaleFactor;
    }

    /**
     * for performance reasons we need to convert the dataURI to a objectURL.  The string size
     * on a typical dataURI is 8-64Mb in size and this is not performant on the canvas.
     *
     * @param file
     * @private
     */
    _processFile(file) {
        this.processing = true;
        this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
            message: this.i18n.tr('messages.loading'),
            showBusy: true
        });

        this.fileManager.getMimeType(file.path).then(mime => {
            _.set(this.options, 'mimeType', mime);
            this.handler.readImage(file, false).then(dataURI => {
                this.dataURI = dataURI;
                this.setScalingFactor();
                this.image = this.handler.toObjectUrl(dataURI, this.options);
                // Have seen cases of the automatic image processing failing if it is clicked too quickly
                // after image loading.  Delay the enablement of actions
                _.delay(() => {
                    this.processing = false;
                }, 3000);
                this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                    message:  this.i18n.tr('messages.loading-done'),
                    showBusy: false,
                    dismiss:  true
                });
                _.delay(() => { // defer till event processing is complete
                    this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                        message:  this.i18n.tr('messages.loading-done'),
                        showBusy: false,
                        dismiss:  true
                    });
                }, 500);
            });
        });

    }

    changeDpiIfNeeded(dataURI, options) {
        if(_.get(options, 'mimeType') !== this.tiffMetaType || _.get(options, 'dpi.mode', 'image') !== 'image') {
            let dpi = _.get(this.options, 'dpi.horizontal', 300);
            dataURI = changeDpiDataUrl(dataURI, dpi);
        }
        return dataURI;
    }

    @computedFrom('boundRegions.length')
    get showSidePanel() {
        return this.boundRegions.length > 0;
    }

    addRegion() {
        this.eventAggregator.publish(EventNames.ADD_REGION);
    }

    deleteSelected() {
        let index = this.getSelectedIndex();
        if (index >= 0) {
            this.boundRegions.splice(index, 1);
            this.eventAggregator.publish('delete-selected', this.selectedRegion);
            this.selectedRegion = undefined;
            this.resetMode();
        }
    }

    getSelectedIndex() {
        return _.findIndex(this.boundRegions, o => { return o === this.selectedRegion});
    }

    resetMode() {
        this.eventAggregator.publish(EventNames.SELECT_MODE);
    }

    clear() {
        this.data = undefined;
        this.dataURI = undefined;
        this.clearBoxes();
        this.resetMode();
    }

    clearBoxes() {
        this.boxes = [];
        ImageBounds.lastCount = 0;
        this.boundRegions.splice(0, this.boundRegions.length);
        this.selectedRegion = undefined;
    }

    zoom(factor) {
        this.toobig = false;
        this.toosmall = false;
        if (factor > 0) {
            this.scalingFactor = Math.min(this.scalingFactor / 0.5, MAX_ZOOM);
        } else {
            this.scalingFactor = Math.max(this.scalingFactor * 0.5, MIN_ZOOM);
        }
        if (this.scalingFactor <= this._MIN_ZOOM) {
            this.toosmall = true;
        } else if (this.scalingFactor >= MAX_ZOOM) {
            this.toobig = true;
        }
        this.resetMode();
    }

    settings() {
        this.showSettings = !this.showSettings;
    }

    @computedFrom('showSettings', 'showSidePanel')
    get imagePanelClassnames() {
        let classNames = '';
        if( this.showSettings ) {
            classNames += ' with-settings-panel';
        }
        if( this.showSidePanel) {
            classNames += ' with-side-panel';
        }
        return classNames;
    }

    process() {
        this.processing = true;
        this.clearBoxes();

        _.defer(() => {
            if (this.dataURI) {
                let asData = !_.isNil(this.dataURI);
                this.handler.process(this.dataURI, this.options, asData).then(info => {
                    this.boxes = info.boxes;
                    this.processing = false;
                }).catch(err => {
                    this.processing = false;
                    this.eventAggregator.publish(EventNames.STATUS_MESSAGE, {
                        message:  this.i18n.tr('messages.processing-failed'),
                        showBusy: false,
                        dismiss:  true
                    });

                });
            }
        });
    }
}
