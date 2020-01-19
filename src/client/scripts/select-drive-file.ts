import DriveWindow from '../components/drive-window.vue';

export function selectDriveFile($root: any) {
	return new Promise((res, rej) => {
		const w = $root.new(DriveWindow, {
		});
		w.$once('chosen', files => {
			res(files);
		});
	});
}
