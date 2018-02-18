import MkChooseFileFromDriveWindow from '../views/components/choose-file-from-drive-window.vue';

export default function(opts) {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = new MkChooseFileFromDriveWindow({
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
