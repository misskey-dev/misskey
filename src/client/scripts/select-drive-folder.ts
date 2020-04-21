import DriveWindow from '../components/drive-window.vue';

export function selectDriveFolder($root: any, multiple) {
	return new Promise((res, rej) => {
		const w = $root.new(DriveWindow, {
			type: 'folder',
			multiple
		});
		w.$once('selected', folders => {
			res(multiple ? folders : (folders.length === 0 ? null : folders[0]));
		});
	});
}
