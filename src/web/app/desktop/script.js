/**
 * Desktop Client
 */

require('chart.js');
require('./tags.ls');
const riot = require('riot');
const boot = require('../boot.ls');
const mixins = require('./mixins.ls');
const route = require('./router.ls');
const fuckAdBlock = require('./scripts/fuck-ad-block.ls');

/**
 * Boot
 */
boot(me => {
	/**
	 * Fuck AD Block
	 */
	fuckAdBlock();

	/**
	 * Init Notification
	 */
	if ('Notification' in window) {
		// 許可を得ていなかったらリクエスト
		if (Notification.permission == 'default') {
			Notification.requestPermission();
		}
	}

	// Register mixins
	mixins(me);

	// Debug
	if (me != null && me.data.debug) {
		riot.mount(document.body.appendChild(document.createElement('mk-log-window')));
	}

	// Start routing
	route(me);
});
