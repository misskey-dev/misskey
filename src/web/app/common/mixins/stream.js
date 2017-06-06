import * as riot from 'riot';

export default stream => {
	riot.mixin('stream', { stream });
};
