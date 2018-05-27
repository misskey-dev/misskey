import OS from '../../mios';
import Dialog from '../views/components/dialog.vue';

export default (os: OS) => opts => {
	return new Promise<string>((res, rej) => {
		const o = opts || {};
		const d = os.new(Dialog, {
			title: o.title,
			text: o.text,
			modal: o.modal,
			buttons: o.actions
		});
		d.$once('clicked', id => {
			res(id);
		});
		document.body.appendChild(d.$el);
	});
}
