import { faUpload, faCloud, faLink } from '@fortawesome/free-solid-svg-icons';
import * as os from '@/os';
import { i18n } from '@/i18n';

export function selectFile(src: any, label: string | null, multiple = false) {
	return new Promise((res, rej) => {
		const chooseFileFromPc = () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = multiple;
			input.onchange = () => {
				const promises = Array.from(input.files).map(file => os.upload(file));

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
				title: i18n.global.t('uploadFromUrl'),
				input: {
					placeholder: i18n.global.t('uploadFromUrlDescription')
				}
			}).then(({ canceled, result: url }) => {
				if (canceled) return;

				const marker = Math.random().toString(); // TODO: UUIDとか使う

				const connection = os.stream.useSharedConnection('main');
				connection.on('urlUploadFinished', data => {
					if (data.marker === marker) {
						res(multiple ? [data.file] : data.file);
						connection.dispose();
					}
				});

				os.api('drive/files/upload_from_url', {
					url: url,
					marker
				});

				os.dialog({
					title: i18n.global.t('uploadFromUrlRequested'),
					text: i18n.global.t('uploadFromUrlMayTakeTime')
				});
			});
		};

		os.menu({
			items: [label ? {
				text: label,
				type: 'label'
			} : undefined, {
				text: i18n.global.t('upload'),
				icon: faUpload,
				action: chooseFileFromPc
			}, {
				text: i18n.global.t('fromDrive'),
				icon: faCloud,
				action: chooseFileFromDrive
			}, {
				text: i18n.global.t('fromUrl'),
				icon: faLink,
				action: chooseFileFromUrl
			}],
		}, {
			source: src,
		});
	});
}
