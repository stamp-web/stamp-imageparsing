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
import {EventAggregator} from 'aurelia-event-aggregator';
import {DialogService} from 'aurelia-dialog';
import {StatusDialog} from 'resources/elements/dialogs/status-dialog';
import {EventNames} from 'util/constants';
import _ from 'lodash';

export class MessageManager {

    static inject = [DialogService, EventAggregator];

    messages = [];
    subscribers = [];
    dialogHandler;
    shown = false;
    messageData = {};

    constructor(dialogService, eventAggregator) {
        this.dialogService = dialogService;
        this.eventAggregator = eventAggregator;

        this.initialize();
    }

    initialize() {
        this.subscribers.push(this.eventAggregator.subscribe(EventNames.STATUS_MESSAGE, this._notifyMessage.bind(this)));
    }

    dispose() {
        _.forEach(this.subscribers, subscriber => {
            subscriber.dispose();
        });
    }

    _notifyMessage(data) {
        _.assign(this.messageData, data);
        if (data.message) {
            this.messages.push(data.message);
            if (!this.shown) {
                this.showStatus();
            }
        }
        if (data.dismiss) {
            _.delay(this.clearStatus.bind(this), 500);
        }
    }

    clearStatus( ) {
        if (this.dialogHandler) {
            this.dialogHandler.controller.cancel().then(() => {
                this.dialogHandler = undefined;
                this.shown = false;
            });
        }
    }

    showStatus() {
        this.shown = true;
        this.dialogService.open({
            viewModel: StatusDialog,
            model: this.messageData
        }).then(dialogResult => {
            this.dialogHandler = dialogResult;
            return dialogResult.closeResult;
        });
    }
}
