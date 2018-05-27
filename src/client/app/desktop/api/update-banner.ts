import OS from '../../mios';
import { apiUrl } from '../../config';
import CropWindow from '../views/components/crop-window.vue';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default (os: OS) => {

	const cropImage = file => new Promise((resolve, reject) => {
		const w = os.new(CropWindow, {
			image: file,
			title: 'バナーとして表示する部分を選択',
			aspectRatio: 16 / 9
		});

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', os.store.state.i.token);
			data.append('file', blob, file.name + '.cropped.png');

			os.api('drive/folders/find', {
				name: 'バナー'
			}).then(bannerFolder => {
				if (bannerFolder.length === 0) {
					os.api('drive/folders/create', {
						name: 'バナー'
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
		const dialog = os.new(ProgressDialog, {
			title: '新しいバナーをアップロードしています'
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
		return os.api('i/update', {
			bannerId: file.id
		}).then(i => {
			os.store.commit('updateIKeyValue', {
				key: 'bannerId',
				value: i.bannerId
			});
			os.store.commit('updateIKeyValue', {
				key: 'bannerUrl',
				value: i.bannerUrl
			});

			os.apis.dialog({
				title: '%fa:info-circle%バナーを更新しました',
				text: '新しいバナーが反映されるまで時間がかかる場合があります。',
				actions: [{
					text: 'わかった'
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
				title: '%fa:image%バナーにする画像を選択'
			});

		return selectedFile
			.then(cropImage)
			.then(setBanner)
			.catch(err => err && console.warn(err));
	};
};
