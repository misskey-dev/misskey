import OS from '../../mios';
import { apiUrl } from '../../config';
import CropWindow from '../views/components/crop-window.vue';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default (os: OS) => (cb, file = null) => {
	const fileSelected = file => {

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
			}).then(iconFolder => {
				if (iconFolder.length === 0) {
					os.api('drive/folders/create', {
						name: '%i18n:desktop.avatar%'
					}).then(iconFolder => {
						upload(data, iconFolder);
					});
				} else {
					upload(data, iconFolder[0]);
				}
			});
		});

		w.$once('skipped', () => {
			set(file);
		});

		document.body.appendChild(w.$el);
	};

	const upload = (data, folder) => {
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
			set(file);
		};

		xhr.upload.onprogress = e => {
			if (e.lengthComputable) (dialog as any).update(e.loaded, e.total);
		};

		xhr.send(data);
	};

	const set = file => {
		os.api('i/update', {
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

			if (cb) cb(i);
		});
	};

	if (file) {
		fileSelected(file);
	} else {
		os.apis.chooseDriveFile({
			multiple: false,
			title: '%fa:image% %i18n:desktop.choose-avatar%'
		}).then(file => {
			fileSelected(file);
		});
	}
};
