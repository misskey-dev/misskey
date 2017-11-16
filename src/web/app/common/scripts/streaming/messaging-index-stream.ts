import Stream from './stream';

/**
 * Messaging index stream connection
 */
export default class Connection extends Stream {
	constructor(me) {
		super('messaging-index', {
			i: me.token
		});
	}
}
