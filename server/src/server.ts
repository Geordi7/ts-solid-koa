
import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import serve from 'koa-static';
import path from 'path';
import fs from 'fs';
import fsp from 'fs/promises';

type State = {};
type Context = {
    log: (...args: unknown[]) => void,
};

const app = new Koa<State, Context>();
app.listen(3001, () => console.log('istening on 3001'));

app.use(async (ctx, next) => {
    ctx.log = console.log;
    const start = performance.now();
    try {
        await next();
        const time = performance.now() - start;
        ctx.log(
            ctx.method,
            ctx.URL.href,
            `${time.toFixed(2)} ms`,
            JSON.stringify(ctx.request.body, null, 2)
        );
    } catch (e) {
        const time = performance.now() - start;
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

app.use(serve(path.join('..','client','dist')));

const router = new Router<State, Context>();
app.use(router.routes());
app.use(router.allowedMethods());

const defaultBodyPath = path.join('..','client','dist','index.html')
const getDefaultBody = () => fsp.readFile(defaultBodyPath);
const defaultBody = fs.readFileSync(defaultBodyPath);
    

router.get(/.*/, async c => {
    c.status = 200;
    c.res.setHeader('content-type', 'text/html');
    c.body = false ? // @TODO config.production
        defaultBody :
        await getDefaultBody();
});