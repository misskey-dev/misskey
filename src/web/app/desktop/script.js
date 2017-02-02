/**
 * Desktop Client
 */

require('chart.js');
require('./tags/index.ls');
const riot = require('riot');
const boot = require('../boot.js');
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

	// Start routing
	route(me);
});
