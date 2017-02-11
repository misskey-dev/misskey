riot = require \riot

spinner = null
pending = 0

net = riot.observable!

riot.mixin \net do
	net: net

module.exports = (i, endpoint, data = {}) ->
	if ++pending == 1
		spinner := document.create-element \div
			..set-attribute \id \wait
		document.body.append-child spinner
	
	if i? and typeof i == \object then i = i.token

	# append user token when signed in
	if i? then data.i = i

	opts =
		method: \POST
		body: JSON.stringify data

	if endpoint == \signin
		opts.credentials = \include

	ep = if (endpoint.index-of '://') > -1
		then endpoint
		else "#{CONFIG.api.url}/#{endpoint}"

	new Promise (resolve, reject) ->
		timer = set-timeout ->
			net.trigger \detected-slow-network
		, 5000ms

		fetch ep, opts
		.then (res) ->
			clear-timeout timer
			if --pending == 0
				spinner.parent-node.remove-child spinner

			if res.status == 200
				res.json!.then resolve
			else if res.status == 204
				resolve!
			else
				res.json!.then (err) ->
					reject err.error
		.catch reject
