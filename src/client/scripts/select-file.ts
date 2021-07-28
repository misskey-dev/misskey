import * as os from '@client/os';
import { i18n } from '@client/i18n';
import { defaultStore } from '@client/store';

export function selectFile(src: any, label: string | null, multiple = false) {
	return new Promise((res, rej) => {
		const chooseFileFromPc = () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = multiple;
			input.onchange = () => {
				const promises = Array.from(input.files).map(file => os.upload(file, defaultStore.state.uploadFolder));

				Promise.all(promises).then(driveFiles => {
					res(multiple ? driveFiles : driveFiles[0]);
				}).catch(e => {
					os.dialog({
						type: 'error',
						text: e
					});
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
			os.selectDriveFile(multiple).then(files => {
				res(files);
			});
		};

		const chooseFileFromUrl = () => {
			os.dialog({
				title: i18n.locale.uploadFromUrl,
				input: {
					placeholder: i18n.locale.uploadFromUrlDescription
				}
			}).then(({ canceled, result: url }) => {
				if (canceled) return;

				const marker = Math.random().toString(); // TODO: UUIDとか使う

				const connection = os.stream.useChannel('main');
				connection.on('urlUploadFinished', data => {
					if (data.marker === marker) {
						res(multiple ? [data.file] : data.file);
						connection.dispose();
					}
				});

				os.api('drive/files/upload-from-url', {
					url: url,
					folderId: defaultStore.state.uploadFolder,
					marker
				});

				os.dialog({
					title: i18n.locale.uploadFromUrlRequested,
					text: i18n.locale.uploadFromUrlMayTakeTime
				});
			});
		};

		os.modalMenu([label ? {
			text: label,
			type: 'label'
		} : undefined, {
			text: i18n.locale.upload,
			icon: 'fas fa-upload',
			action: chooseFileFromPc
		}, {
			text: i18n.locale.fromDrive,
			icon: 'fas fa-cloud',
			action: chooseFileFromDrive
		}, {
			text: i18n.locale.fromUrl,
			icon: 'fas fa-link',
			action: chooseFileFromUrl
		}], src);
	});
}
