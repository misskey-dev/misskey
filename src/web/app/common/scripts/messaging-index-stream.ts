import Stream from './stream';

/**
 * Messaging index stream connection
 */
class Connection extends Stream {
	constructor(me) {
		super('messaging-index', {
			i: me.token
		});
	}
}

export default Connection;
