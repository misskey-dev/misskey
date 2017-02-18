const stream = require('../../common/scripts/stream');
const riot = require('riot');

module.exports = me => {
	const s = stream(me);
	riot.mixin('stream', {
		stream: s.event,
		getStreamState: s.getState,
		streamStateEv: s.stateEv
	});
};
