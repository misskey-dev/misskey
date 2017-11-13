import * as riot from 'riot';

export default (title, text, buttons, canThrough?, onThrough?) => {
	const dialog = document.body.appendChild(document.createElement('mk-dialog'));
	const controller = riot.observable();
	(riot as any).mount(dialog, {
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
