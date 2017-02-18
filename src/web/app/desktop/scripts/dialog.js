const riot = require('riot');

module.exports = (title, text, buttons, canThrough, onThrough) => {
	const dialog = document.body.appendChild(document.createElement('mk-dialog'));
	const controller = riot.observable();
	riot.mount(dialog, {
		controller: controller,
		title: title,
		text: text,
		buttons: buttons,
		canThrough: canThrough,
		onThrough: onThrough
	});
	controller.trigger('open');
	return controller;
};
