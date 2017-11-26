import * as riot from 'riot';

export default (title, onOk, onCancel) => {
	const dialog = document.body.appendChild(document.createElement('mk-input-dialog'));
	return (riot as any).mount(dialog, {
		title: title,
		type: 'password',
		onOk: onOk,
		onCancel: onCancel
	});
};
