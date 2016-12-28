# Stream
#================================

ReconnectingWebSocket = require 'reconnecting-websocket'
riot = require 'riot'

class Connection
	(me, otherparty) ~>
		@event = riot.observable!
		@me = me
		host = CONFIG.api.url.replace \http \ws
		@socket = new ReconnectingWebSocket "#{host}/messaging?otherparty=#{otherparty}"

		@socket.add-event-listener \open @on-open
		@socket.add-event-listener \message @on-message

	on-open: ~>
		@socket.send JSON.stringify do
			i: @me.token

	on-message: (message) ~>
		try
			message = JSON.parse message.data
			if message.type?
				@event.trigger message.type, message.body
		catch
			# ignore

	close: ~>
		@socket.remove-event-listener \open @on-open
		@socket.remove-event-listener \message @on-message
		@socket.close!

module.exports = Connection
