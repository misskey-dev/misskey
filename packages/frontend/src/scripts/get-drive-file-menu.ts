import * as Misskey from 'misskey-js';
import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n';
import copyToClipboard from '@/scripts/copy-to-clipboard';
import * as os from '@/os';

function rename(file: Misskey.entities.DriveFile) {
	os.inputText({
		title: i18n.ts.renameFile,
		placeholder: i18n.ts.inputNewFileName,
		default: file.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		os.api('drive/files/update', {
			fileId: file.id,
			name: name,
		});
	});
}

function describe(file: Misskey.entities.DriveFile) {
	os.popup(defineAsyncComponent(() => import('@/components/MkFileCaptionEditWindow.vue')), {
		default: file.comment != null ? file.comment : '',
		file: file,
	}, {
		done: caption => {
			os.api('drive/files/update', {
				fileId: file.id,
				comment: caption.length === 0 ? null : caption,
			});
		},
	}, 'closed');
}

function toggleSensitive(file: Misskey.entities.DriveFile) {
	os.api('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	});
}

function copyUrl(file: Misskey.entities.DriveFile) {
	copyToClipboard(file.url);
	os.success();
}
/*
function addApp() {
	alert('not implemented yet');
}
*/
async function deleteFile(file: Misskey.entities.DriveFile) {
	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.t('driveFileDeleteConfirm', { name: file.name }),
	});

	if (canceled) return;
	os.api('drive/files/delete', {
		fileId: file.id,
	});
}

export function getDriveFileMenu(file: Misskey.entities.DriveFile) {
	return [{
		text: i18n.ts.rename,
		icon: 'ti ti-forms',
		action: rename,
	}, {
		text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye' : 'ti ti-eye-off',
		action: toggleSensitive,
	}, {
		text: i18n.ts.describeFile,
		icon: 'ti ti-text-caption',
		action: describe,
	}, null, {
		text: i18n.ts.copyUrl,
		icon: 'ti ti-link',
		action: copyUrl,
	}, {
		type: 'a',
		href: file.url,
		target: '_blank',
		text: i18n.ts.download,
		icon: 'ti ti-download',
		download: file.name,
	}, null, {
		text: i18n.ts.delete,
		icon: 'ti ti-trash',
		danger: true,
		action: deleteFile,
	}];
}
