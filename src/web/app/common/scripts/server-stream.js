'use strict';

import Stream from './stream';

/**
 * Server stream connection
 */
class Connection extends Stream {
	constructor() {
		super('server');
	}
}

export default Connection;
