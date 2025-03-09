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
import { unisonReload } from '@/scripts/unison-reload.js';

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
		unisonReload();
	};

	input.click();
}

export async function cloudBackup() {
	if ($i == null) return;

	await misskeyApi('i/registry/set', {
		scope: ['client', 'preferences', 'backups'],
		key: profileManager.profile.name || profileManager.profile.id,
		value: profileManager.profile,
	});
}

async function restoreFromCloudBackup() {
	if ($i == null) return;

	// TODO: 更新日時でソートして取得したい
	const keys = await misskeyApi('i/registry/keys', {
		scope: ['client', 'preferences', 'backups'],
	});

	console.log(keys);

	if (keys.length === 0) {
		os.alert({
			type: 'warning',
			title: i18n.ts._preferencesBackup.noBackupsFoundTitle,
			text: i18n.ts._preferencesBackup.noBackupsFoundDescription,
		});
		return;
	}

	const select = await os.select({
		title: i18n.ts._preferencesBackup.selectBackupToRestore,
		items: keys.map(k => ({
			text: k,
			value: k,
		})),
	});
	if (select.canceled) return;
	if (select.result == null) return;

	const profile = await misskeyApi('i/registry/get', {
		scope: ['client', 'preferences', 'backups'],
		key: select.result,
	});

	console.log(profile);

	miLocalStorage.setItem('preferences', JSON.stringify(profile));
	unisonReload();
}
