riot = require \riot

spinner = null
pending = 0

net = riot.observable!

riot.mixin \net do
	net: net

log = (riot.mixin \log).log

module.exports = (i, endpoint, data) ->
	pending++

	if i? and typeof i == \object then i = i.token

	body = []

	# append user token when signed in
	if i? then body.push "i=#i"

	for k, v of data
		if v != undefined
			v = encodeURIComponent v
			body.push "#k=#v"

	opts =
		method: \POST
		headers:
			'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'
		body: body.join \&

	if endpoint == \signin
		opts.credentials = \include

	ep = if (endpoint.index-of '://') > -1
		then endpoint
		else "#{CONFIG.api.url}/#{endpoint}"

	if pending == 1
		spinner := document.create-element \div
			..set-attribute \id \wait
		document.body.append-child spinner

	new Promise (resolve, reject) ->
		timer = set-timeout ->
			net.trigger \detected-slow-network
		, 5000ms

		log "API: #{ep}"

		fetch ep, opts
		.then (res) ->
			pending--
			clear-timeout timer
			if pending == 0
				spinner.parent-node.remove-child spinner

			if res.status == 200
				res.json!.then resolve
			else if res.status == 204
				resolve!
			else
				res.json!.then (err) ->
					reject err.error
		.catch reject
