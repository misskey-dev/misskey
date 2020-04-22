export function selectDriveFolder($root: any, multiple) {
	return new Promise((res, rej) => {
		import('../components/drive-window.vue').then(m => m.default).then(dialog => {
			const w = $root.new(dialog, {
				type: 'folder',
				multiple
			});
			w.$once('selected', folders => {
				res(multiple ? folders : (folders.length === 0 ? null : folders[0]));
			});
		});
	});
}
