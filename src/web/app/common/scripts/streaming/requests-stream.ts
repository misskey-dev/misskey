import Stream from './stream';

/**
 * Requests stream connection
 */
export default class Connection extends Stream {
	constructor() {
		super('requests');
	}
}
