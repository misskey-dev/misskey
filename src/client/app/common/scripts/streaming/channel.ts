import Stream from './stream';
import MiOS from '../../../mios';

/**
 * Channel stream connection
 */
export default class Connection extends Stream {
	constructor(os: MiOS, channelId) {
		super(os, 'channel', {
			channel: channelId
		});
	}
}
