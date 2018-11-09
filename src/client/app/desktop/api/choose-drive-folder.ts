import MkChooseFolderFromDriveWindow from '../views/components/choose-folder-from-drive-window.vue';

export default (ne: Function) => opts => {
	return new Promise((res, rej) => {
		const o = opts || {};
		const w = ne(MkChooseFolderFromDriveWindow, {
			title: o.title,
			initFolder: o.currentFolder
		});
		w.$once('selected', folder => {
			res(folder);
		});
		document.body.appendChild(w.$el);
	});
};
