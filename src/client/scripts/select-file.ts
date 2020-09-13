import { faUpload, faCloud } from '@fortawesome/free-solid-svg-icons';
import { selectDriveFile } from './select-drive-file';
import { apiUrl } from '@/config';
import { store } from '@/store';
import * as os from '@/os';
import { locale } from '@/i18n';

export function selectFile(src: any, label: string | null, multiple = false) {
	return new Promise((res, rej) => {
		const chooseFileFromPc = () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = multiple;
			input.onchange = () => {
				const dialog = os.dialog({
					type: 'waiting',
					text: locale['uploading'] + '...',
					showOkButton: false,
					showCancelButton: false,
					cancelableByBgClick: false
				});

				const promises = Array.from(input.files).map(file => new Promise((ok, err) => {
					const data = new FormData();
					data.append('file', file);
					data.append('i', store.state.i.token);

					fetch(apiUrl + '/drive/files/create', {
						method: 'POST',
						body: data
					})
					.then(response => response.json())
					.then(ok)
					.catch(err);
				}));

				Promise.all(promises).then(driveFiles => {
					res(multiple ? driveFiles : driveFiles[0]);
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
				}).finally(() => {
					dialog.cancel();
				});

				// 一応廃棄
				(window as any).__misskey_input_ref__ = null;
			};

			// https://qiita.com/fukasawah/items/b9dc732d95d99551013d
			// iOS Safari で正常に動かす為のおまじない
			(window as any).__misskey_input_ref__ = input;

			input.click();
		};

		const chooseFileFromDrive = () => {
			selectDriveFile(multiple).then(files => {
				res(files);
			});
		};

		// TODO
		const chooseFileFromUrl = () => {

		};

		os.menu({
			items: [label ? {
				text: label,
				type: 'label'
			} : undefined, {
				text: locale['upload'],
				icon: faUpload,
				action: chooseFileFromPc
			}, {
				text: locale['fromDrive'],
				icon: faCloud,
				action: chooseFileFromDrive
			}, /*{
				text: locale('fromUrl'),
				icon: faLink,
				action: chooseFileFromUrl
			}*/],
		}, {
			source: src,
		});
	});
}
