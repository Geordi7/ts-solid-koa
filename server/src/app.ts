
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';
import KoaWebsocket = require('koa-websocket');

type State = {
    start: number,
    wsConnection?: number,
    wsMessage?: number,
};

type Context = {
    log: (...args: unknown[]) => void,
};

export const app = KoaWebsocket(new Koa<State, Context>());

app.use(async (ctx, next) => {
    ctx.log = console.log;
    ctx.state.start = performance.now();
    try {
        await next();
        const time = performance.now() - ctx.state.start;
        ctx.log(
            ctx.method,
            ctx.URL.href,
            `${time.toFixed(2)} ms`,
            JSON.stringify(ctx.request.body, null, 2)
        );
    } catch (e) {
        const time = performance.now() - ctx.state.start;
        ctx.log(
            ctx.method,
            ctx.URL.href,
            `${time.toFixed(2)} ms`,
            JSON.stringify(ctx.request.body, null, 2)
        );
        ctx.log('ERROR', e);
    }
});

app.use(bodyParser());

const staticContentPath = path.join('..','client','dist')
const defaultBodyPath = path.join(staticContentPath,'index.html')
const getDefaultBody = () => fsp.readFile(defaultBodyPath);
const defaultBody = fs.readFileSync(defaultBodyPath);

app.use(serve(staticContentPath));

const router = new Router<State, Context>();
app.use(router.routes());
app.use(router.allowedMethods());

router.get(/.*/, async c => {
    c.status = 200;
    c.res.setHeader('content-type', 'text/html');
    c.body = false ? // @TODO config.production
        defaultBody :
        await getDefaultBody();
});