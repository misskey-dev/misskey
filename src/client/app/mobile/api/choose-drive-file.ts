import Chooser from '../views/components/drive-file-chooser.vue';

export default function(opts) {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = new Chooser({
			propsData: {
				title: o.title,
				multiple: o.multiple,
				initFolder: o.currentFolder
			}
		}).$mount();
		w.$once('selected', file => {
			res(file);
		});
		document.body.appendChild(w.$el);
	});
}
