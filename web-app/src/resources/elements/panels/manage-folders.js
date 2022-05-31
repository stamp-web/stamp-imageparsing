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
import {customElement, observable, inject, LogManager} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {EventAggregator} from 'aurelia-event-aggregator';
import {StorageKeys, EventNames} from '../../../util/constants';
import {FileManager} from 'manager/file-manager';
import {CreateFolderDialog} from '../dialogs/create-folder-dialog';

import _ from 'lodash';



@customElement('manage-folders')
@inject(EventAggregator, FileManager, DialogService)
export class ManageFolders{

    @observable selectedFolder;
    folders = [];

    _subscribers = [];

    constructor(eventAggregator, fileManager, dialogService) {
        this.eventAggregator = eventAggregator;
        this.fileManager = fileManager;
        this.dialogService = dialogService;

        this.logger = LogManager.getLogger('manage-folders');
    }

    activate() {
        this.selectedFolder = localStorage.getItem(StorageKeys.OUTPUT_PATH);
        this._subscribers.push(this.eventAggregator.subscribe(EventNames.FOLDER_SELECTED, this.handleFolderSelection.bind(this)));
    }

    deactivate() {
        _.forEach(this._subscribers, sub => {
            sub.dispose();
        });
    }

    createNewFolder() {
        this.dialogService.open({
            viewModel: CreateFolderDialog,
            model: {}
        }).then(dialogResult => {
            dialogResult.closeResult.then(value => {
                let folder = value.output;
                if (!_.isEmpty(folder)) {
                    this.fileManager.createFolder(this.selectedFolder, folder).then(() => {
                        this._refreshFolders();
                    }).catch(err => {
                        this.logger.error('Error creating the folder', err);
                    });
                }
            });
        });
    }

    handleFolderSelection(newFolder) {
        this.selectedFolder = newFolder;
    }

    selectedFolderChanged() {
        this._refreshFolders();
    }

    _refreshFolders() {
        this.fileManager.getFolders(this.selectedFolder).then(folders => {
            this.folders = folders;
        });
    }

}
