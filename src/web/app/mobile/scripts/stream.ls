# Stream
#================================

stream = require '../../common/scripts/stream.ls'
riot = require \riot

module.exports = (me) ~>
	s = stream me

	riot.mixin \stream do
		stream: s.event
		get-stream-state: s.get-state
		stream-state-ev: s.state-ev
