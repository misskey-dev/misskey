riot = require \riot

module.exports = (me) ~>
	i = if me? then me.token else null

	(require './scripts/i') me

	riot.mixin \api do
		api: (require './scripts/api').bind null i

	riot.mixin \cropper do
		Cropper: require \cropperjs

	riot.mixin \signout do
		signout: require './scripts/signout.js'

	riot.mixin \messaging-stream do
		MessagingStreamConnection: require './scripts/messaging-stream'

	riot.mixin \is-promise do
		is-promise: require './scripts/is-promise.ls'

	riot.mixin \get-post-summary do
		get-post-summary: require './scripts/get-post-summary.js'

	riot.mixin \date-stringify do
		date-stringify: require './scripts/date-stringify.ls'

	riot.mixin \text do
		analyze: require '../../../common/text/index.js'
		compile: require './scripts/text-compiler.js'

	riot.mixin \get-password-strength do
		get-password-strength: require 'syuilo-password-strength'

	riot.mixin \ui-progress do
		Progress: require './scripts/loading.ls'
