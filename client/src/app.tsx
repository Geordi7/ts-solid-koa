import { Component, JSXElement, lazy } from 'solid-js';
import { Router, RouteDefinition, Location } from '@solidjs/router';
import { SlashPathSplit } from './common';
import { is } from '@geordi7/fint';

const routes = [
  route('/', () =>
    <div class="section">
      <div class="container">
        <h1 class="title">Hello, there!</h1>
        <p class="subtitle">This is a simple SolidJS app using Bulma CSS.</p>
        <button class="button is-primary">Primary Button</button>
      </div>
    </div>
  ),
  route('/greet/:name', ({params}) =>
    <div class="section">
      <div class="container">
        <h1 class="title">Hello, {params.name}!</h1>
        <p class="subtitle">This is a simple SolidJS app using Bulma CSS.</p>
        <button class="button is-primary">Primary Button</button>
      </div>
    </div>
  ),
  route('*', () =>
    <div class="section">
      <div class="container">
        <h1 class="title">Sorry, we didn't find what you were looking for</h1>
        <p class="subtitle">Error - 404</p>
      </div>
    </div>
  ),
] satisfies RouteDefinition[]

export function route<Path extends string>(path: Path, rd: RouteDef<Path>): RouteDefinition {
  const bits = path.split('/').filter(s => s.length > 0);
  const params = bits.filter(s => s.startsWith(':'));

  if (params.length > 0) {
    const filters = (is.function(rd) || !rd.filters) ? {} :
      {matchFilters: rd.filters};

    const componentFn = (is.function(rd) ? rd : rd.component);

    return {
      path,
      component: componentFn as any,
      ...filters
    };
  } else {
    return {path, component: rd as Component}
  }
}

export type RouteDef<Path extends string> =
  RouteParams<Path> extends never ?
    Component :
    | PathComponent<Path>
    | (
      RouteParams<Path> extends never ? never : {
        component: PathComponent<Path>,
        filters?: RouteFilter<Path>,
      }
    )
;

export type PathComponent<Path extends string> =
  RouteParams<Path> extends never ? never : (props: RouteProps<{[K in RouteParams<Path>]: string}>) => JSXElement
;

export type RouteFilter<Path extends string> = 
  RouteParams<Path> extends never ? never : {
  [K in RouteParams<Path>]: string[] | RegExp | ((s: string) => boolean)
};

export type RouteParams<Path extends string> =
  SlashPathSplit<Path> extends infer S ?
    S extends `:${infer Param}` ? Param : never :
    never;
export type BaseProps = Record<string,any>

export type RouteProps<Params extends Record<string, string>> = {
  params: Params;
  location: Location;
  data: unknown;
  children?: JSXElement;
}

type Z = RouteParams<'/greet/:a'>

export default () => <Router>{routes}</Router>;
