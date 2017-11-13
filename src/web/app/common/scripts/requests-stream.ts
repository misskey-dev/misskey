'use strict';

import Stream from './stream';

/**
 * Requests stream connection
 */
class Connection extends Stream {
	constructor() {
		super('requests');
	}
}

export default Connection;
