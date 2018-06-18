import OS from '../../mios';
import MkChooseFolderFromDriveWindow from '../views/components/choose-folder-from-drive-window.vue';

export default (os: OS) => opts => {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = os.new(MkChooseFolderFromDriveWindow, {
			title: o.title,
			initFolder: o.currentFolder
		});
		w.$once('selected', folder => {
			res(folder);
		});
		document.body.appendChild(w.$el);
	});
};
