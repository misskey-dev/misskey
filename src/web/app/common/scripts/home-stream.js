'use strict';

import Stream from './stream';
import signout from './signout';

/**
 * Home stream connection
 */
class Connection extends Stream {
	constructor(me) {
		super('', {
			i: me.token
		});

		this.on('i_updated', me.update);

		this.on('my_token_regenerated', () => {
			alert('%i18n:common.my-token-regenerated%');
			signout();
		});
	}
}

export default Connection;
