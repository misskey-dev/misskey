riot = require \riot

module.exports = (me) ->
	riot.mixin \i do
		init: ->
			@I = me
			@SIGNIN = me?

			if @SIGNIN
				@on \mount   ~> me.on  \updated @update
				@on \unmount ~> me.off \updated @update

		update-i: (data) ->
			if data?
				Object.assign me, data
			me.trigger \updated
