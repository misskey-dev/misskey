const riot = require('riot');

module.exports = message => {
	const notification = document.body.appendChild(document.createElement('mk-ui-notification'));
	riot.mount(notification, {
		message: message
	});
};
