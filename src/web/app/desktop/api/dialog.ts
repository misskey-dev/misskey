import Dialog from '../views/components/dialog.vue';

export default function(opts) {
	return new Promise<string>((res, rej) => {
		const o = opts || {};
		const d = new Dialog({
			propsData: {
				title: o.title,
				text: o.text,
				modal: o.modal,
				buttons: o.actions
			}
		}).$mount();
		d.$once('clicked', id => {
			res(id);
		});
		document.body.appendChild(d.$el);
	});
}
