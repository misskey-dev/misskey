import Stream from './stream';

/**
 * Server stream connection
 */
export default class Connection extends Stream {
	constructor() {
		super('server');
	}
}
