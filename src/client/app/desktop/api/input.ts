import OS from '../../mios';
import InputDialog from '../views/components/input-dialog.vue';

export default (os: OS) => opts => {
	return new Promise<string>((res, rej) => {
		const o = opts || {};
		const d = os.new(InputDialog, {
			title: o.title,
			placeholder: o.placeholder,
			default: o.default,
			type: o.type || 'text',
			allowEmpty: o.allowEmpty
		});
		d.$once('done', text => {
			res(text);
		});
		document.body.appendChild(d.$el);
	});
};
