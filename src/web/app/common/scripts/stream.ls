# Stream
#================================

ReconnectingWebSocket = require \reconnecting-websocket
riot = require \riot

module.exports = (me) ~>
	state = \initializing
	state-ev = riot.observable!
	event = riot.observable!

	host = CONFIG.api.url.replace \http \ws
	socket = new ReconnectingWebSocket "#{host}?i=#{me.token}"

	socket.onopen = ~>
		state := \connected
		state-ev.trigger \connected

	socket.onclose = ~>
		state := \reconnecting
		state-ev.trigger \closed

	socket.onmessage = (message) ~>
		try
			message = JSON.parse message.data
			if message.type?
				event.trigger message.type, message.body
		catch
			# ignore

	get-state = ~> state

	event.on \i_updated me.update

	{
		state-ev
		get-state
		event
	}
