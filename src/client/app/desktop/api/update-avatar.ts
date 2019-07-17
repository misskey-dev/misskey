import { apiUrl, locale } from '../../config';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default ($root: any) => {

	const cropImage = file => new Promise(async (resolve, reject) => {
		const CropWindow = await import('../views/components/crop-window.vue').then(x => x.default);
		const w = $root.new(CropWindow, {
			image: file,
			title: locale['desktop']['avatar-crop-title'],
			aspectRatio: 1 / 1
		});

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', $root.$store.state.i.token);
			data.append('file', blob, file.name + '.cropped.png');

			$root.api('drive/folders/find', {
				name: locale['desktop']['avatar']
			}).then(avatarFolder => {
				if (avatarFolder.length === 0) {
					$root.api('drive/folders/create', {
						name: locale['desktop']['avatar']
					}).then(iconFolder => {
						resolve(upload(data, iconFolder));
					});
				} else {
					resolve(upload(data, avatarFolder[0]));
				}
			});
		});

		w.$once('skipped', () => {
			resolve(file);
		});

		w.$once('cancelled', reject);

		document.body.appendChild(w.$el);
	});

	const upload = (data, folder) => new Promise((resolve, reject) => {
		const dialog = $root.new(ProgressDialog, {
			title: locale['desktop']['uploading-avatar']
		});
		document.body.appendChild(dialog.$el);

		if (folder) data.append('folderId', folder.id);

		const xhr = new XMLHttpRequest();
		xhr.open('POST', apiUrl + '/drive/files/create', true);
		xhr.onload = e => {
			const file = JSON.parse((e.target as any).response);
			(dialog as any).close();
			resolve(file);
		};
		xhr.onerror = reject;

		xhr.upload.onprogress = e => {
			if (e.lengthComputable) (dialog as any).update(e.loaded, e.total);
		};

		xhr.send(data);
	});

	const setAvatar = file => {
		return $root.api('i/update', {
			avatarId: file.id
		}).then(i => {
			$root.$store.commit('updateIKeyValue', {
				key: 'avatarId',
				value: i.avatarId
			});
			$root.$store.commit('updateIKeyValue', {
				key: 'avatarUrl',
				value: i.avatarUrl
			});

			$root.dialog({
				title: locale['desktop']['avatar-updated'],
				text: null
			});

			return i;
		}).catch(err => {
			switch (err.id) {
				case 'f419f9f8-2f4d-46b1-9fb4-49d3a2fd7191':
					$root.dialog({
						type: 'error',
						title: locale['desktop']['unable-to-process'],
						text: locale['desktop']['invalid-filetype']
					});
					break;
				default:
					$root.dialog({
						type: 'error',
						text: locale['desktop']['unable-to-process']
					});
			}
		});
	};

	return (file = null) => {
		const selectedFile = file
			? Promise.resolve(file)
			: $root.$chooseDriveFile({
				multiple: false,
				type: 'image/*',
				title: locale['desktop']['choose-avatar']
			});

		return selectedFile
			.then(cropImage)
			.then(setAvatar)
			.catch(err => err && console.warn(err));
	};
};
