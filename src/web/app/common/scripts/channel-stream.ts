'use strict';

import Stream from './stream';

/**
 * Channel stream connection
 */
class Connection extends Stream {
	constructor(channelId) {
		super('channel', {
			channel: channelId
		});
	}
}

export default Connection;
