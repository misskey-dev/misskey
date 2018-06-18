import OS from '../../mios';
import { apiUrl } from '../../config';
import CropWindow from '../views/components/crop-window.vue';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default (os: OS) => (cb, file = null) => {
	const fileSelected = file => {

		const w = os.new(CropWindow, {
			image: file,
			title: 'アバターとして表示する部分を選択',
			aspectRatio: 1 / 1
		});

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', os.store.state.i.token);
			data.append('file', blob, file.name + '.cropped.png');

			os.api('drive/folders/find', {
				name: 'アイコン'
			}).then(iconFolder => {
				if (iconFolder.length === 0) {
					os.api('drive/folders/create', {
						name: 'アイコン'
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
			title: '新しいアバターをアップロードしています'
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
				title: '%fa:info-circle%アバターを更新しました',
				text: '新しいアバターが反映されるまで時間がかかる場合があります。',
				actions: [{
					text: 'わかった'
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
			title: '%fa:image%アバターにする画像を選択'
		}).then(file => {
			fileSelected(file);
		});
	}
};
