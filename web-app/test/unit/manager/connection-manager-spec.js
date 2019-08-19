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
