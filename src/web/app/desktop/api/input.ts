import InputDialog from '../views/components/input-dialog.vue';

export default function(opts) {
	return new Promise<string>((res, rej) => {
		const o = opts || {};
		const d = new InputDialog({
			propsData: {
				title: o.title,
				placeholder: o.placeholder,
				default: o.default,
				type: o.type || 'text'
			}
		}).$mount();
		d.$once('done', text => {
			res(text);
		});
		document.body.appendChild(d.$el);
	});
}
