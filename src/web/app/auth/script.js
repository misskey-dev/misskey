/**
 * Authorize Form
 */

// Style
//import './style.styl';
require('./style.styl');

const riot = require('riot');
document.title = 'Misskey | アプリの連携';
require('./tags');
const boot = require('../boot.js');

/**
 * Boot
 */
boot(me => {
	mount(document.createElement('mk-index'));
});

function mount(content) {
	riot.mount(document.getElementById('app').appendChild(content));
}
