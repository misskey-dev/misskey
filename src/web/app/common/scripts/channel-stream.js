'use strict';

import Stream from './stream';

/**
 * Channel stream connection
 */
class Connection extends Stream {
	constructor() {
		super('channel');
	}
}

export default Connection;
