/**
 * Desktop Client
 */

// Style
import './style.styl';

require('./tags');
require('./mixins');
import * as riot from 'riot';
import boot from '../boot';
import route from './router';
import fuckAdBlock from './scripts/fuck-ad-block';

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

	// Start routing
	route(me);
});
