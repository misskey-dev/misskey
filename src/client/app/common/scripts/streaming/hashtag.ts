import Stream from './stream';
import MiOS from '../../../mios';

export class HashtagStream extends Stream {
	constructor(os: MiOS, me, q) {
		super(os, 'hashtag', me ? {
			i: me.token,
			q: JSON.stringify(q)
		} : {
			q: JSON.stringify(q)
		});
	}
}
