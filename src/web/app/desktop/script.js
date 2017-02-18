/**
 * Desktop Client
 */

require('chart.js');
require('./tags');
const riot = require('riot');
const boot = require('../boot');
const mixins = require('./mixins');
const route = require('./router');
const fuckAdBlock = require('./scripts/fuck-ad-block');

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
