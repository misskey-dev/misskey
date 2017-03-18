import * as riot from 'riot';
import Connection from '../scripts/stream';

export default me => {
	const stream = me ? new Connection(me) : null;
	riot.mixin('stream', {
		stream: stream
	});
};
