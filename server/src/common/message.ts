
import * as v from '@badrap/valita';

export type AppPath = string[];
export const vAppPath = v.array(v.string());

export type User = string[] & {readonly 'User': unique symbol};
export const vUser = v.string() as unknown as v.Type<User>;

export type ClientMessage = v.Infer<typeof vClientMessage>;
export const vClientMessage = v.union(
    v.object({
        subscribe: vAppPath,
    }),
    v.object({
        unsubscribe: vAppPath,
    }),
    v.object({
        send: vAppPath,
        event: v.lazy(() => vAppEvent),
    }),
);

export type ServerMessage = v.Infer<typeof vServerMessage>;
export const vServerMessage = v.union(
    v.object({
        send: vAppPath,
        event: v.lazy(() => vAppEvent),
    }),
)

export type AppEvent = v.Infer<typeof vAppEvent>;
export const vAppEvent = v.union(
    v.object({
        message: vUser,
        id: v.string(),
        content: v.string(),
    }),
)

