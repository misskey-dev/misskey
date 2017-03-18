import * as riot from 'riot';

export default message => {
	const notification = document.body.appendChild(document.createElement('mk-ui-notification'));
	riot.mount(notification, {
		message: message
	});
};
