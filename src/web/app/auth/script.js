/**
 * Authorize Form
 */

const riot = require('riot');
document.title = 'Misskey | アプリの連携';
require('./tags/index.ls');
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
