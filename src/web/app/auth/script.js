/**
 * Authorize Form
 */

// Style
import './style.styl';

import * as riot from 'riot';
require('./tags');
import boot from '../boot';

document.title = 'Misskey | アプリの連携';

/**
 * Boot
 */
boot(me => {
	mount(document.createElement('mk-index'));
});

function mount(content) {
	riot.mount(document.getElementById('app').appendChild(content));
}
