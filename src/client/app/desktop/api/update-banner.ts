import { apiUrl, locale } from '../../config';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default ($root: any) => {

	const cropImage = file => new Promise(async (resolve, reject) => {
		const CropWindow = await import('../views/components/crop-window.vue').then(x => x.default);
		const w = $root.new(CropWindow, {
			image: file,
			title: locale['desktop']['banner-crop-title'],
			aspectRatio: 16 / 9
		});

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', $root.$store.state.i.token);
			data.append('file', blob, file.name + '.cropped.png');

			$root.api('drive/folders/find', {
				name: locale['desktop']['banner']
			}).then(bannerFolder => {
				if (bannerFolder.length === 0) {
					$root.api('drive/folders/create', {
						name: locale['desktop']['banner']
					}).then(iconFolder => {
						resolve(upload(data, iconFolder));
					});
				} else {
					resolve(upload(data, bannerFolder[0]));
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
			title: locale['desktop']['uploading-banner']
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

	const setBanner = file => {
		return $root.api('i/update', {
			bannerId: file.id
		}).then(i => {
			$root.$store.commit('updateIKeyValue', {
				key: 'bannerId',
				value: i.bannerId
			});
			$root.$store.commit('updateIKeyValue', {
				key: 'bannerUrl',
				value: i.bannerUrl
			});

			$root.dialog({
				title: locale['desktop']['banner-updated'],
				text: null
			});

			return i;
		}).catch(err => {
			switch (err.id) {
				case '75aedb19-2afd-4e6d-87fc-67941256fa60':
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
				title: locale['desktop']['choose-banner']
			});

		return selectedFile
			.then(cropImage)
			.then(setBanner)
			.catch(err => err && console.warn(err));
	};
};
