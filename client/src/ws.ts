
import {rec, createEventTree} from '@geordi7/fint';
import { AppEvent, AppPath, ClientMessage, vServerMessage } from './common';

const ws = new WebSocket('/');
const evt = createEventTree<AppEvent, void>();

let initialSendQueue = [] as string[];
let wsSend = (m: ClientMessage) => {initialSendQueue.push(JSON.stringify(m))};

const subscriptions = {} as Record<string, Set<(e: AppEvent, src: AppPath) => void>>;

ws.addEventListener('message', m => {
    try {
        const msg = vServerMessage.parse(JSON.parse(m.data));
        console.log('RECEIVING', msg.send, msg.event);
        evt.send(msg.send, msg.event);
    } catch (e) {
        console.log('BAD MESSAGE', m);
    }
});

ws.addEventListener('open', ev => {
    console.log('WS CONNECTED', ev);
    
    for (const m of initialSendQueue) {
        ws.send(m);
    }

    wsSend = (m: ClientMessage) => ws.send(JSON.stringify(m));
});

ws.addEventListener('close', ev => console.log('WS DISCONNECTED', ev));
ws.addEventListener('error', ev => console.log('WS ERROR', ev));

export function subscribe(path: AppPath, handler: (e: AppEvent, src: AppPath) => void) {
    const unsub = evt.subscribe(path, handler);

    const p = path.join('\0');
    if (!(p in subscriptions)) {
        subscriptions[p] = new Set();
        wsSend({subscribe: path});
    }

    subscriptions[p].add(handler);

    return () => {
        unsub();
        subscriptions[p].delete(handler);

        if (subscriptions[p].size === 0) {
            wsSend({unsubscribe: path});
            delete subscriptions[p];
        }
    }
}

export function send(path: AppPath, event: AppEvent) {
    console.log('SENDING', path, event);
    wsSend({send: path, event});
}
