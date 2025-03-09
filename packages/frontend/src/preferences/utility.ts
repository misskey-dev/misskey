/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, watch } from 'vue';
import { apiUrl } from '@@/js/config.js';
import * as Misskey from 'misskey-js';
import type { PreferencesProfile } from './profile.js';
import type { MenuItem } from '@/types/menu.js';
import { copyToClipboard } from '@/scripts/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { prefer, profileManager } from '@/preferences.js';
import * as os from '@/os.js';
import { store } from '@/store.js';
import { $i } from '@/account.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const BACKUP_FOLDER_NAME = 'Misskey Preferences Backups';

export function getPreferencesProfileMenu(): MenuItem[] {
	const autoBackupEnabled = ref(store.state.enablePreferencesAutoCloudBackup);

	watch(autoBackupEnabled, () => {
		if (autoBackupEnabled.value) {
			store.set('enablePreferencesAutoCloudBackup', true);
		} else {
			store.set('enablePreferencesAutoCloudBackup', false);
		}
	});

	const menu: MenuItem[] = [{
		type: 'label',
		text: profileManager.profile.name || `(${i18n.ts.noName})`,
	}, {
		text: i18n.ts.rename,
		icon: 'ti ti-pencil',
		action: () => {
			renameProfile();
		},
	}, {
		type: 'switch',
		icon: 'ti ti-cloud-up',
		text: i18n.ts._preferencesBackup.autoBackup,
		ref: autoBackupEnabled,
	}, {
		text: i18n.ts.export,
		icon: 'ti ti-download',
		action: () => {
			exportCurrentProfile();
		},
	}, {
		type: 'divider',
	}, {
		text: i18n.ts._preferencesBackup.restoreFromBackup,
		icon: 'ti ti-cloud-down',
		action: () => {
			restoreFromCloudBackup();
		},
	}, {
		text: i18n.ts.import,
		icon: 'ti ti-upload',
		action: () => {
			importProfile();
		},
	}];

	if (prefer.s.devMode) {
		menu.push({
			type: 'divider',
		}, {
			text: 'Copy profile as text',
			icon: 'ti ti-clipboard',
			action: () => {
				copyToClipboard(JSON.stringify(profileManager.profile, null, '\t'));
			},
		});
	}

	return menu;
}

async function renameProfile() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts.rename,
		placeholder: profileManager.profile.name || null,
		default: profileManager.profile.name || null,
	});
	if (canceled || name == null) return;
	profileManager.renameProfile(name);
}

function exportCurrentProfile() {
	const p = profileManager.profile;
	const txtBlob = new Blob([JSON.stringify(p)], { type: 'text/plain' });
	const dummya = document.createElement('a');
	dummya.href = URL.createObjectURL(txtBlob);
	dummya.download = `${p.name || p.id}.misskeypreferences`;
	dummya.click();
}

function importProfile() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.misskeypreferences';
	input.onchange = async () => {
		if (input.files == null || input.files.length === 0) return;

		const file = input.files[0];
		const txt = await file.text();
		const profile = JSON.parse(txt) as PreferencesProfile;

		miLocalStorage.setItem('preferences', JSON.stringify(profile));
		location.reload();
	};

	input.click();
}

export function cloudBackup() {
	return new Promise<Misskey.entities.DriveFile>(async (resolve, reject) => {
		if ($i == null) return reject();

		const fileName = `${profileManager.profile.name || profileManager.profile.id}.misskeypreferences`;

		let folder = (await misskeyApi('drive/folders/find', {
			name: BACKUP_FOLDER_NAME,
		}))[0] as Misskey.entities.DriveFolder | null;

		let existingFiles: Misskey.entities.DriveFile[] = [];

		if (folder) {
			existingFiles = await misskeyApi('drive/files/find', {
				name: fileName,
				folderId: folder.id,
			});
		} else {
			folder = await misskeyApi('drive/folders/create', {
				name: BACKUP_FOLDER_NAME,
			});
		}

		const blob = new Blob([JSON.stringify(profileManager.profile)], { type: 'text/plain' });
		const formData = new FormData();
		formData.append('file', blob);
		formData.append('name', fileName);
		formData.append('isSensitive', 'false');
		formData.append('i', $i.token);
		formData.append('folderId', folder!.id);
		window.fetch(apiUrl + '/drive/files/create', {
			method: 'POST',
			body: formData,
		}).then(async res => {
			if (res.ok) {
				res.json().then((created: Misskey.entities.DriveFile) => {
					resolve(created);

					for (const file of existingFiles.filter(f => f.id !== created.id)) { // ファイルハッシュが同じ場合、既存のファイルが返ってくる場合があるのでそれは除外
						misskeyApi('drive/files/delete', {
							fileId: file.id,
						});
					}
				});
			}
		});
	});
}

async function restoreFromCloudBackup() {
	const folder = (await misskeyApi('drive/folders/find', {
		name: BACKUP_FOLDER_NAME,
	}))[0] as Misskey.entities.DriveFolder | null;

	if (folder == null) return;

	const files = await misskeyApi('drive/files', {
		folderId: folder.id,
	});

	if (files.length === 0) {
		os.alert({
			type: 'warning',
			title: i18n.ts._preferencesBackup.noBackupsFoundTitle,
			text: i18n.ts._preferencesBackup.noBackupsFoundDescription,
		});
		return;
	}

	console.log(files);
}
