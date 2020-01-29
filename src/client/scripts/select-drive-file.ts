import DriveWindow from '../components/drive-window.vue';

export function selectDriveFile($root: any, multiple) {
	return new Promise((res, rej) => {
		const w = $root.new(DriveWindow, {
			multiple
		});
		w.$once('selected', files => {
			res(multiple ? files : files[0]);
		});
	});
}
