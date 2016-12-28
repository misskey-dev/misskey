riot = require \riot

module.exports = (message) ~>
	notification = document.body.append-child document.create-element \mk-ui-notification
	riot.mount notification, do
		message: message
