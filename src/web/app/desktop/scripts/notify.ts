import * as riot from 'riot';

export default message => {
	const notification = document.body.appendChild(document.createElement('mk-ui-notification'));
	(riot as any).mount(notification, {
		message: message
	});
};
