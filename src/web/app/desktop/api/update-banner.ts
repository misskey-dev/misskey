import OS from '../../common/mios';
import { apiUrl } from '../../config';
import CropWindow from '../views/components/crop-window.vue';
import ProgressDialog from '../views/components/progress-dialog.vue';

export default (os: OS) => (cb, file = null) => {
	const fileSelected = file => {

		const w = new CropWindow({
			propsData: {
				image: file,
				title: 'バナーとして表示する部分を選択',
				aspectRatio: 16 / 9
			}
		}).$mount();

		w.$once('cropped', blob => {
			const data = new FormData();
			data.append('i', os.i.account.token);
			data.append('file', blob, file.name + '.cropped.png');

			os.api('drive/folders/find', {
				name: 'バナー'
			}).then(bannerFolder => {
				if (bannerFolder.length === 0) {
					os.api('drive/folders/create', {
						name: 'バナー'
					}).then(iconFolder => {
						upload(data, iconFolder);
					});
				} else {
					upload(data, bannerFolder[0]);
				}
			});
		});

		w.$once('skipped', () => {
			set(file);
		});

		document.body.appendChild(w.$el);
	};

	const upload = (data, folder) => {
		const dialog = new ProgressDialog({
			propsData: {
				title: '新しいバナーをアップロードしています'
			}
		}).$mount();
		document.body.appendChild(dialog.$el);

		if (folder) data.append('folder_id', folder.id);

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
			banner_id: file.id
		}).then(i => {
			os.i.banner_id = i.banner_id;
			os.i.banner_url = i.banner_url;

			os.apis.dialog({
				title: '%fa:info-circle%バナーを更新しました',
				text: '新しいバナーが反映されるまで時間がかかる場合があります。',
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
			title: '%fa:image%バナーにする画像を選択'
		}).then(file => {
			fileSelected(file);
		});
	}
};
