const riot = require('riot');

module.exports = (title, placeholder, defaultValue, onOk, onCancel) => {
	const dialog = document.body.appendChild(document.createElement('mk-input-dialog'));
	return riot.mount(dialog, {
		title: title,
		placeholder: placeholder,
		'default': defaultValue,
		onOk: onOk,
		onCancel: onCancel
	});
};
