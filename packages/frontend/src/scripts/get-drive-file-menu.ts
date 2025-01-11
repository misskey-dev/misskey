/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as Misskey from 'misskey-js';
import { defineAsyncComponent } from 'vue';
import { i18n } from '@/i18n.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import * as os from '@/os.js';
import { misskeyApi } from '@/scripts/misskey-api.js';
import type { MenuItem } from '@/types/menu.js';
import { defaultStore } from '@/store.js';

function rename(file: Misskey.entities.DriveFile) {
	os.inputText({
		title: i18n.ts.renameFile,
		placeholder: i18n.ts.inputNewFileName,
		default: file.name,
	}).then(({ canceled, result: name }) => {
		if (canceled) return;
		misskeyApi('drive/files/update', {
			fileId: file.id,
			name: name,
		});
	});
}

function describe(file: Misskey.entities.DriveFile) {
	const { dispose } = os.popup(defineAsyncComponent(() => import('@/components/MkFileCaptionEditWindow.vue')), {
		default: file.comment ?? '',
		file: file,
	}, {
		done: caption => {
			misskeyApi('drive/files/update', {
				fileId: file.id,
				comment: caption.length === 0 ? null : caption,
			});
		},
		closed: () => dispose(),
	});
}

function move(file: Misskey.entities.DriveFile) {
	os.selectDriveFolder(false).then(folder => {
		misskeyApi('drive/files/update', {
			fileId: file.id,
			folderId: folder[0] ? folder[0].id : null,
		});
	});
}

function toggleSensitive(file: Misskey.entities.DriveFile) {
	misskeyApi('drive/files/update', {
		fileId: file.id,
		isSensitive: !file.isSensitive,
	}).catch(err => {
		os.alert({
			type: 'error',
			title: i18n.ts.error,
			text: err.message,
		});
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
		text: i18n.tsx.driveFileDeleteConfirm({ name: file.name }),
	});

	if (canceled) return;
	misskeyApi('drive/files/delete', {
		fileId: file.id,
	});
}

export function getDriveFileMenu(file: Misskey.entities.DriveFile, folder?: Misskey.entities.DriveFolder | null): MenuItem[] {
	const isImage = file.type.startsWith('image/');

	const menuItems: MenuItem[] = [];

	menuItems.push({
		type: 'link',
		to: `/my/drive/file/${file.id}`,
		text: i18n.ts._fileViewer.title,
		icon: 'ti ti-info-circle',
	}, { type: 'divider' }, {
		text: i18n.ts.rename,
		icon: 'ti ti-forms',
		action: () => rename(file),
	}, {
		text: i18n.ts.move,
		icon: 'ti ti-folder-symlink',
		action: () => move(file),
	}, {
		text: file.isSensitive ? i18n.ts.unmarkAsSensitive : i18n.ts.markAsSensitive,
		icon: file.isSensitive ? 'ti ti-eye' : 'ti ti-eye-exclamation',
		action: () => toggleSensitive(file),
	}, {
		text: i18n.ts.describeFile,
		icon: 'ti ti-text-caption',
		action: () => describe(file),
	});

	if (isImage) {
		menuItems.push({
			text: i18n.ts.cropImage,
			icon: 'ti ti-crop',
			action: () => os.cropImage(file, {
				aspectRatio: NaN,
				uploadFolder: folder ? folder.id : folder,
			}),
		});
	}

	menuItems.push({ type: 'divider' }, {
		text: i18n.ts.createNoteFromTheFile,
		icon: 'ti ti-pencil',
		action: () => os.post({
			initialFiles: [file],
		}),
	}, {
		text: i18n.ts.copyUrl,
		icon: 'ti ti-link',
		action: () => copyUrl(file),
	}, {
		type: 'a',
		href: file.url,
		target: '_blank',
		text: i18n.ts.download,
		icon: 'ti ti-download',
		download: file.name,
	}, { type: 'divider' }, {
		text: i18n.ts.delete,
		icon: 'ti ti-trash',
		danger: true,
		action: () => deleteFile(file),
	});

	if (defaultStore.state.devMode) {
		menuItems.push({ type: 'divider' }, {
			icon: 'ti ti-id',
			text: i18n.ts.copyFileId,
			action: () => {
				copyToClipboard(file.id);
			},
		});
	}

	return menuItems;
}
