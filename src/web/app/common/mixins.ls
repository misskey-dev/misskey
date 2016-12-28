riot = require \riot

module.exports = (me) ~>
	i = if me? then me.token else null

	(require './scripts/i.ls') me

	riot.mixin \api do
		api: (require './scripts/api.ls').bind null i

	riot.mixin \cropper do
		Cropper: require \cropper

	riot.mixin \signout do
		signout: require './scripts/signout.ls'

	riot.mixin \messaging-stream do
		MessagingStreamConnection: require './scripts/messaging-stream.ls'

	riot.mixin \is-promise do
		is-promise: require './scripts/is-promise.ls'

	riot.mixin \get-post-summary do
		get-post-summary: require './scripts/get-post-summary.ls'

	riot.mixin \date-stringify do
		date-stringify: require './scripts/date-stringify.ls'

	riot.mixin \text do
		analyze: require 'misskey-text'
		compile: require './scripts/text-compiler.js'

	riot.mixin \get-password-strength do
		get-password-strength: require 'strength.js'

	riot.mixin \ui-progress do
		Progress: require './scripts/loading.ls'

	riot.mixin \bytes-to-size do
		bytes-to-size: require './scripts/bytes-to-size.js'
