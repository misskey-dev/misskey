riot = require \riot

function open(name, opts)
	window = document.body.append-child document.create-element name
	riot.mount window, opts

riot.mixin \open-window do
	open-window: open
