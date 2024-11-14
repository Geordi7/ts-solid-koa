
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
const mark = Symbol();
const marked = (event: unknown, connection: number) => {
    const e = event as {[mark]?: Set<number>};
    e[mark] = e[mark] ?? new Set();
    if (e[mark].has(connection)) {
        return true;
    } else {
        e[mark].add(connection);
        return false;
    }
}

app.ws.use(async (ctx) => {
    const subscriptions = {} as Record<string, Unsubscribe>;

    const send = (m: ServerMessage) => {
        const msgNum = tagMsg();
        ctx.log(ctx.state.wsConnection, 'SEND', msgNum, m);
        ctx.websocket.send(JSON.stringify(m), err => {
            if (err) ctx.log(ctx.state.wsConnection, 'SEND-FAILED', msgNum, err);
        });
    }

    ctx.websocket.on('message', m => {
        const msgNum = tagMsg();
        const time = performance.now() - ctx.state.start;
        try {
            const msg = vClientMessage.parse(JSON.parse(m.toString()));
            ctx.log(ctx.state.wsConnection, time, 'RECEIVE', msgNum, msg);

            match(msg, {
                subscribe: s => {
                    const p = s.subscribe.join('\0');
                    subscriptions[p] = evt.subscribe(s.subscribe, (event, to) =>
                        marked(event, ctx.state.wsConnection!) ? null :
                            send({send: to, event}));
                },
                unsubscribe: s => {
                    const p = s.unsubscribe.join('\0');
                    if (!(p in subscriptions)) {
                        ctx.log('invalid subscription!');
                        return;
                    }

                    subscriptions[p]!();
                    delete subscriptions[p];
                },
                send: s => {
                    marked(s.event, ctx.state.wsConnection!);
                    evt.send(s.send, s.event);
                }
            });
        } catch (e) {
            ctx.log(ctx.state.wsConnection, 'RECEIVE-FAILED', msgNum, e, m.toString());
        }
    });

    ctx.websocket.on('close', ev => {
        console.log('WS-CLOSE', ctx.state.wsConnection, performance.now() - ctx.state.start, ev);
        for (const unsub of rec.v(subscriptions)) unsub();
    });
});
