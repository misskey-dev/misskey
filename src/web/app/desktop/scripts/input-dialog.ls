# Input Dialog
#================================

riot = require 'riot'

module.exports = (title, placeholder, default-value, on-ok, on-cancel) ~>
	dialog = document.body.append-child document.create-element \mk-input-dialog
	riot.mount dialog, do
		title: title
		placeholder: placeholder
		default: default-value
		on-ok: on-ok
		on-cancel: on-cancel
