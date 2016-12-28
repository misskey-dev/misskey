uuid = require './uuid.js'

home =
	left: [ \profile \calendar \rss-reader \photo-stream ]
	right: [ \broadcast \notifications \user-recommendation \donation \nav \tips ]

module.exports = ~>
	home-data = []

	home.left.for-each (widget) ~>
		home-data.push do
			name: widget
			id: uuid!
			place: \left

	home.right.for-each (widget) ~>
		home-data.push do
			name: widget
			id: uuid!
			place: \right

	data =
		cache: true
		debug: false
		home: home-data

	return data
