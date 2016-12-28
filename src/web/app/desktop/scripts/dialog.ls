# Dialog
#================================

riot = require 'riot'

module.exports = (title, text, buttons, can-through, on-through) ~>
	dialog = document.body.append-child document.create-element \mk-dialog
	controller = riot.observable!
	riot.mount dialog, do
		controller: controller
		title: title
		text: text
		buttons: buttons
		can-through: can-through
		on-through: on-through
	controller.trigger \open
	return controller
