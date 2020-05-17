import { faUpload, faCloud } from '@fortawesome/free-solid-svg-icons';
import { selectDriveFile } from './select-drive-file';
import { apiUrl } from '../config';

export function selectFile(component: any, src: any, label: string | null, multiple = false) {
	return new Promise((res, rej) => {
		const chooseFileFromPc = () => {
			const input = document.createElement('input');
			input.type = 'file';
			input.multiple = multiple;
			input.onchange = () => {
				const dialog = component.$root.dialog({
					type: 'waiting',
					text: component.$t('uploading') + '...',
					showOkButton: false,
					showCancelButton: false,
					cancelableByBgClick: false
				});

				const promises = Array.from(input.files).map(file => new Promise((ok, err) => {
					const data = new FormData();
					data.append('file', file);
					data.append('i', component.$store.state.i.token);

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
					component.$root.dialog({
						type: 'error',
						text: e
					});
				}).finally(() => {
					dialog.close();
				});
			};
			input.click();
		};

		const chooseFileFromDrive = () => {
			selectDriveFile(component.$root, multiple).then(files => {
				res(files);
			});
		};

		// TODO
		const chooseFileFromUrl = () => {

		};

		component.$root.menu({
			items: [label ? {
				text: label,
				type: 'label'
			} : undefined, {
				text: component.$t('upload'),
				icon: faUpload,
				action: chooseFileFromPc
			}, {
				text: component.$t('fromDrive'),
				icon: faCloud,
				action: chooseFileFromDrive
			}, /*{
				text: component.$t('fromUrl'),
				icon: faLink,
				action: chooseFileFromUrl
			}*/],
			source: src
		});
	});
}
