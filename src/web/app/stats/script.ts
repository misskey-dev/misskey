/**
 * Stats
 */

// Style
import './style.styl';

import * as riot from 'riot';
require('./tags');
import init from '../init';

document.title = 'Misskey Statistics';

/**
 * init
 */
init(me => {
	mount(document.createElement('mk-index'));
});

function mount(content) {
	riot.mount(document.getElementById('app').appendChild(content));
}
