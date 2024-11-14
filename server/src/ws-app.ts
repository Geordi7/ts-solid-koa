
import { createEventTree, match, rec, Unsubscribe } from '@geordi7/fint';
import {app as KoaApp} from './app';
import { AppEvent, ServerMessage, vClientMessage } from './common';
import KoaWebsocket from 'koa-websocket';

const evt = createEventTree<AppEvent, void>();

export const app = KoaWebsocket(KoaApp);

let connectionNumber = 0;
app.ws.use(async (ctx, next) => {
    ctx.log = console.log;
    ctx.state.start = performance.now();
    ctx.state.wsConnection = connectionNumber++;
    try {
        await next();
        const time = performance.now() - ctx.state.start;
        ctx.log(
            'WS',
            ctx.state.wsConnection,
            ctx.method,
            ctx.URL.href,
            `${time.toFixed(2)} ms`,
            JSON.stringify(ctx.request.body, null, 2)
        );
    } catch (e) {
        const time = performance.now() - ctx.state.start;
        ctx.log(
            'WS',
            ctx.state.wsConnection,
            ctx.method,
            ctx.URL.href,
            `${time.toFixed(2)} ms`,
            JSON.stringify(ctx.request.body, null, 2)
        );
        ctx.log('ERROR', e);
    }
});

let messageNumber = 0;
const tagMsg = () => messageNumber++;

app.ws.use(async (ctx) => {
    const subscriptions = {} as Record<string, Record<number, Unsubscribe>>;

    const send = (m: ServerMessage) => {
        const msgNum = tagMsg();
        ctx.log(ctx.state.wsConnection, 'SEND', msgNum, m);
        ctx.websocket.send(JSON.stringify(m), err => {
            ctx.log(ctx.state.wsConnection, 'SEND-FAILED', msgNum, err);
        });
    }

    ctx.websocket.on('message', m => {
        const msgNum = tagMsg();
        try {
            const ms = JSON.parse(m.toString());
            ctx.log(ctx.state.wsConnection, 'RECEIVE', msgNum, ms);
            const msg = vClientMessage.parse(ms);

            match(msg, {
                subscribe: s => {
                    const p = s.subscribe.join('\0');
                    subscriptions[p] = subscriptions[p] ?? {};
                    subscriptions[p][s.channel] = evt.subscribe(s.subscribe, event =>
                        send({send: s.subscribe, event}));
                },
                unsubscribe: s => {
                    const p = s.unsubscribe.join('\0');
                    if (!(p in subscriptions) || !(s.channel in subscriptions[p]!)) {
                        ctx.log('invalid subscription!');
                        return;
                    }

                    subscriptions[p]![s.channel]!();
                    delete subscriptions[p]![s.channel];
                },
                send: s => {
                    evt.send(s.send, s.event);
                }
            });
        } catch (e) {
            ctx.log(ctx.state.wsConnection, 'RECEIVE-FAILED', msgNum, e);
        }
    })
});
