/* @refresh reload */
import { render } from 'solid-js/web';
import App from './app';
import { send, subscribe } from './ws';
import { vUser } from './common';

console.log('here we are!');

render(() => App(), document.getElementById('root') as HTMLElement);

subscribe(['a','b','c'], e => console.log(e));
send([], {message: vUser.parse('geordi'), content: 'hello there', id: '3'});
