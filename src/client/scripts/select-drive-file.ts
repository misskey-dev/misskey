import * as os from '@/os';

export function selectDriveFile(multiple) {
	return new Promise(async (res, rej) => {
		os.modal(await import('@/components/drive-window.vue'), {
			type: 'file',
			multiple
		}).then(files => {
			res(multiple ? files : files[0]);
		});
	});
}
