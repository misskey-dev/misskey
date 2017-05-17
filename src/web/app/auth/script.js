/**
 * Authorize Form
 */

// Style
import './style.styl';

import * as riot from 'riot';
require('./tags');
import init from '../init';

document.title = 'Misskey | アプリの連携';

/**
 * init
 */
init(me => {
	mount(document.createElement('mk-index'));
});

function mount(content) {
	riot.mount(document.getElementById('app').appendChild(content));
}
