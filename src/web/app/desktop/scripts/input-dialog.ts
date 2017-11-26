import * as riot from 'riot';

export default (title, placeholder, defaultValue, onOk, onCancel) => {
	const dialog = document.body.appendChild(document.createElement('mk-input-dialog'));
	return (riot as any).mount(dialog, {
		title: title,
		placeholder: placeholder,
		'default': defaultValue,
		onOk: onOk,
		onCancel: onCancel
	});
};
