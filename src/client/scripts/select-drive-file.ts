export function selectDriveFile($root: any, multiple) {
	return new Promise((res, rej) => {
		import('../components/drive-window.vue').then(dialog => {
			const w = $root.new(dialog, {
				type: 'file',
				multiple
			});
			w.$once('selected', files => {
				res(multiple ? files : files[0]);
			});
		});
	});
}
