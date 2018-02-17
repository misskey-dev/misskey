import MkChooseFolderFromDriveWindow from '../../../common/views/components/choose-folder-from-drive-window.vue';

export default function(this: any, opts) {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = new MkChooseFolderFromDriveWindow({
			parent: this,
			propsData: {
				title: o.title
			}
		}).$mount();
		w.$once('selected', folder => {
			res(folder);
		});
		document.body.appendChild(w.$el);
	});
}
