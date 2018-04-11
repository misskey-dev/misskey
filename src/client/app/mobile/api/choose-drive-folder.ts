import Chooser from '../views/components/drive-folder-chooser.vue';

export default function(opts) {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = new Chooser({
			propsData: {
				title: o.title,
				initFolder: o.currentFolder
			}
		}).$mount();
		w.$once('selected', folder => {
			res(folder);
		});
		document.body.appendChild(w.$el);
	});
}
