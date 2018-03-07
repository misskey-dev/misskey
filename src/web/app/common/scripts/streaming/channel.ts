import Stream from './stream';

/**
 * Channel stream connection
 */
export default class Connection extends Stream {
	constructor(channelId) {
		super('channel', {
			channel: channelId
		});
	}
}
