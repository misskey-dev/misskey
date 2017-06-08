'use strict';

import Stream from './stream';

/**
 * Home stream connection
 */
class Connection extends Stream {
	constructor(me) {
		super('', {
			i: me.token
		});

		this.on('i_updated', me.update);
	}
}

export default Connection;
