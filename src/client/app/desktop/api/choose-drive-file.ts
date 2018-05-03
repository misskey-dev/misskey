import { url } from '../../config';
import MkChooseFileFromDriveWindow from '../views/components/choose-file-from-drive-window.vue';

export default function(opts) {
	return new Promise((res, rej) => {
		const o = opts || {};

		if (document.body.clientWidth > 800) {
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
		} else {
			window['cb'] = file => {
				res(file);
			};

			window.open(url + '/selectdrive',
				'choose_drive_window',
				'height=500, width=800');
		}
	});
}
