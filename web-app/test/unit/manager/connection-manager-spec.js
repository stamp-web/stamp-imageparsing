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
import {ConnectionManager} from 'manager/connection-manager';
import {EventAggregator} from 'aurelia-event-aggregator';
import _ from 'lodash';

describe('ConnectionManager', () => {

    describe('addSubscriber', () => {
        let connectionMgr;

        beforeEach(() => {
             connectionMgr = new ConnectionManager(new EventAggregator());
        });

        it('verify new subscriber added', () => {
            let fn = () => { };
            connectionMgr.addSubscriber('channel1', fn);
            expect(connectionMgr.subscribers).not.toBeUndefined();
            let subscribers = _.get(connectionMgr, 'subscribers.channel1');
            expect(subscribers).not.toBeUndefined();
            expect(subscribers.length).toBe(1);
            expect(subscribers[0]).toBe(fn);
        });

        it('verify multiple subscribers added', () => {
            connectionMgr.addSubscriber('channel1', ()=>{});
            connectionMgr.addSubscriber('channel1', ()=>{});
            expect(connectionMgr.subscribers).not.toBeUndefined();
            expect(connectionMgr.subscribers.channel1.length).toBe(2);
        });

        it('verify stomp subscriber bound', () => {
            let stompSpy = jasmine.createSpyObj('stompClient', ['subscribe']);
            let fn = () => { };
            stompSpy.connected = true;
            connectionMgr.connected = true;
            connectionMgr.stompClient = stompSpy;
            connectionMgr.addSubscriber('channel1', fn);
            expect(stompSpy.subscribe).toHaveBeenCalledWith('channel1', fn);
        });
    });
});
