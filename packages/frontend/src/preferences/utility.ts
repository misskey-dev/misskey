/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, watch } from 'vue';
import type { PreferencesProfile } from './profile.js';
import type { MenuItem } from '@/types/menu.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { store } from '@/store.js';
import { $i } from '@/account.js';
import { misskeyApi } from '@/utility/misskey-api.js';
import { unisonReload } from '@/utility/unison-reload.js';

function canAutoBackup() {
	return prefer.profile.name != null && prefer.profile.name.trim() !== '';
}

export function getPreferencesProfileMenu(): MenuItem[] {
	const autoBackupEnabled = ref(store.s.enablePreferencesAutoCloudBackup);

	watch(autoBackupEnabled, () => {
		if (autoBackupEnabled.value) {
			if (!canAutoBackup()) {
				autoBackupEnabled.value = false;
				os.alert({
					type: 'warning',
					title: i18n.ts._preferencesBackup.youNeedToNameYourProfileToEnableAutoBackup,
				});
				return;
			}

			store.set('enablePreferencesAutoCloudBackup', true);
		} else {
			store.set('enablePreferencesAutoCloudBackup', false);
		}
	});

	const menu: MenuItem[] = [{
		type: 'label',
		text: prefer.profile.name || `(${i18n.ts.noName})`,
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
				copyToClipboard(JSON.stringify(prefer.profile, null, '\t'));
			},
		});
	}

	return menu;
}

async function renameProfile() {
	const { canceled, result: name } = await os.inputText({
		title: i18n.ts._preferencesProfile.profileName,
		text: i18n.ts._preferencesProfile.profileNameDescription + '\n' + i18n.ts._preferencesProfile.profileNameDescription2,
		placeholder: prefer.profile.name || null,
		default: prefer.profile.name || null,
	});
	if (canceled || name == null || name.trim() === '') return;

	prefer.renameProfile(name);
}

function exportCurrentProfile() {
	const p = prefer.profile;
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
		miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
		shouldSuggestRestoreBackup.value = false;
		unisonReload();
	};

	input.click();
}

export async function cloudBackup() {
	if ($i == null) return;
	if (!canAutoBackup()) {
		throw new Error('Profile name is not set');
	}

	await misskeyApi('i/registry/set', {
		scope: ['client', 'preferences', 'backups'],
		key: prefer.profile.name,
		value: prefer.profile,
	});
}

export async function restoreFromCloudBackup() {
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
	miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
	store.set('enablePreferencesAutoCloudBackup', true);
	shouldSuggestRestoreBackup.value = false;
	unisonReload();
}

export async function enableAutoBackup() {
	if (!canAutoBackup()) {
		await renameProfile();
	}

	if (!canAutoBackup()) {
		return;
	}

	store.set('enablePreferencesAutoCloudBackup', true);
}

export const shouldSuggestRestoreBackup = ref(false);

if ($i != null) {
	if (new Date($i.createdAt).getTime() > (Date.now() - 1000 * 60 * 30)) { // アカウント作成直後は意味ないので除外
		miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
	} else {
		if (miLocalStorage.getItem('hidePreferencesRestoreSuggestion') !== 'true') {
			misskeyApi('i/registry/keys', {
				scope: ['client', 'preferences', 'backups'],
			}).then(keys => {
				if (keys.length === 0) {
					miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
				} else {
					shouldSuggestRestoreBackup.value = true;
				}
			});
		}
	}
}

export function hideRestoreBackupSuggestion() {
	miLocalStorage.setItem('hidePreferencesRestoreSuggestion', 'true');
	shouldSuggestRestoreBackup.value = false;
}
