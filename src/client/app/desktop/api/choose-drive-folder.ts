import MkChooseFolderFromDriveWindow from '../views/components/choose-folder-from-drive-window.vue';

export default function(opts) {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = new MkChooseFolderFromDriveWindow({
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
