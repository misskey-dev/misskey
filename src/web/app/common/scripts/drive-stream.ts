import Stream from './stream';

/**
 * Drive stream connection
 */
class Connection extends Stream {
	constructor(me) {
		super('drive', {
			i: me.token
		});
	}
}

export default Connection;
