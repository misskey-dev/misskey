import Stream from './stream';

/**
 * Drive stream connection
 */
export default class Connection extends Stream {
	constructor(me) {
		super('drive', {
			i: me.token
		});
	}
}
