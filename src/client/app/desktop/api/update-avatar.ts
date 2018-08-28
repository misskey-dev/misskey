import OS from '../../mios';
import { apiUrl } from '../../config';
import CropWindow from '../views/components/crop-window.vue';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default (os: OS) => {

	const cropImage = file => new Promise((resolve, reject) => {
		
		var regex = RegExp('\.(jpg|jpeg|png|gif|webp|bmp|tiff)$')
		if(!regex.test(file.name) ) {
			os.apis.dialog({
				title: '%fa:info-circle% %i18n:desktop.invalid-filetype%',
				text: null,
				actions: [{
					text: '%i18n:common.got-it%'
				}]
			});
			reject
		}
		
		const w = os.new(CropWindow, {
			image: file,
			title: '%i18n:desktop.avatar-crop-title%',
			aspectRatio: 1 / 1
		});

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', os.store.state.i.token);
			data.append('file', blob, file.name + '.cropped.png');

			os.api('drive/folders/find', {
				name: '%i18n:desktop.avatar%'
			}).then(avatarFolder => {
				if (avatarFolder.length === 0) {
					os.api('drive/folders/create', {
						name: '%i18n:desktop.avatar%'
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
		const dialog = os.new(ProgressDialog, {
			title: '%i18n:desktop.uploading-avatar%'
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
		return os.api('i/update', {
			avatarId: file.id
		}).then(i => {
			os.store.commit('updateIKeyValue', {
				key: 'avatarId',
				value: i.avatarId
			});
			os.store.commit('updateIKeyValue', {
				key: 'avatarUrl',
				value: i.avatarUrl
			});

			os.apis.dialog({
				title: '%fa:info-circle% %i18n:desktop.avatar-updated%',
				text: null,
				actions: [{
					text: '%i18n:common.got-it%'
				}]
			});

			return i;
		});
	};

	return (file = null) => {
		const selectedFile = file
			? Promise.resolve(file)
			: os.apis.chooseDriveFile({
				multiple: false,
				title: '%fa:image% %i18n:desktop.choose-avatar%'
			});

		return selectedFile
			.then(cropImage)
			.then(setAvatar)
			.catch(err => err && console.warn(err));
	};
};
