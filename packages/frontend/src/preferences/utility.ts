/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, ref, watch } from 'vue';
import { mergeProfiles } from './manager.js';
import type { PreferencesProfile } from './manager.js';
import type { MenuItem } from '@/types/menu.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { prefer } from '@/preferences.js';
import * as os from '@/os.js';
import { store } from '@/store.js';
import { $i } from '@/i.js';
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

			cloudBackup();
		} else {
			store.set('enablePreferencesAutoCloudBackup', false);

			autoSyncEnabled.value = false;
		}
	});

	const autoSyncEnabled = ref(store.s.enablePreferencesAutoCloudSync);

	watch(autoSyncEnabled, async () => {
		if (autoSyncEnabled.value) {
			const confirm = await os.confirm({
				type: 'warning',
				title: i18n.ts._preferencesBackup.autoSyncAreYouSure,
				text: i18n.ts._preferencesBackup.autoSyncAreYouSure_description,
			});
			if (confirm.canceled) {
				autoSyncEnabled.value = false;
				return;
			}

			try {
				await cloudSync();
				store.set('enablePreferencesAutoCloudSync', true);
			} catch (err) {
				autoSyncEnabled.value = false;
				os.alert({
					type: 'error',
					title: i18n.ts.somethingHappened,
				});
				console.error(err);
			}
		} else {
			store.set('enablePreferencesAutoCloudSync', false);
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
		type: 'parent',
		text: i18n.ts._preferencesBackup.backupAndSync,
		caption: i18n.ts.latestBackupAt + ': ' + (store.s.latestPreferencesBackupAt !== 0 ? new Date(store.s.latestPreferencesBackupAt).toLocaleString() : '-'),
		icon: 'ti ti-cloud',
		children: [{
			type: 'switch',
			icon: 'ti ti-cloud-up',
			text: i18n.ts._preferencesBackup.autoBackup,
			caption: i18n.ts._preferencesBackup.autoBackup_description,
			ref: autoBackupEnabled,
		}, {
			type: 'button',
			icon: 'ti ti-cloud-up',
			text: i18n.ts._preferencesBackup.forceBackup,
			disabled: computed(() => !autoBackupEnabled.value),
			action: () => {
				cloudBackup();
			},
		}, {
			type: 'divider',
		}, {
			type: 'switch',
			icon: 'ti ti-cloud-down',
			text: i18n.ts._preferencesBackup.autoSync,
			caption: i18n.ts._preferencesBackup.autoSync_description,
			ref: autoSyncEnabled,
			disabled: computed(() => !autoBackupEnabled.value),
		}, {
			type: 'button',
			icon: 'ti ti-cloud-down',
			text: i18n.ts._preferencesBackup.forceSync,
			disabled: computed(() => !autoSyncEnabled.value),
			action: () => {
				cloudSync();
			},
		}],
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
	}, {
		type: 'divider',
	}, {
		type: 'link',
		text: i18n.ts._preferencesProfile.manageProfiles + '...',
		icon: 'ti ti-settings-cog',
		to: '/settings/profiles',
	}];

	if (prefer.s.devMode) {
		menu.push({
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
	const dummya = window.document.createElement('a');
	dummya.href = URL.createObjectURL(txtBlob);
	dummya.download = `${p.name || p.id}.misskeypreferences`;
	dummya.click();
}

function importProfile() {
	const input = window.document.createElement('input');
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

export async function cloudSync() {
	if ($i == null) return;

	const cloudProfile = await misskeyApi('i/registry/get', {
		scope: ['client', 'preferences', 'backups'],
		key: prefer.profile.name,
	}).catch(err => {
		if (err.code === 'NO_SUCH_KEY') {
			return null;
		}
		throw err;
	}) as PreferencesProfile | null;

	if (cloudProfile == null) {
		if (_DEV_) console.log('no backuped profile found, skipping sync');
		return;
	}

	if (_DEV_) console.log('backuped profile found, syncing', cloudProfile);

	miLocalStorage.setItem('preferences', JSON.stringify(mergeProfiles(prefer.profile, cloudProfile)));

	prefer.reloadProfile();

	store.set('latestPreferencesSyncAt', Date.now());
}

// TODO: Web Locks APIで良い感じにする
export async function cloudBackup() {
	if ($i == null) return;
	if (!canAutoBackup()) {
		throw new Error('cannot auto backup for this profile');
	}

	let currentProfile = prefer.profile;

	if (_DEV_) console.log('cloud backup', currentProfile);

	const backupedProfile = await misskeyApi('i/registry/get', {
		scope: ['client', 'preferences', 'backups'],
		key: prefer.profile.name,
	}).catch(err => {
		if (err.code === 'NO_SUCH_KEY') {
			return null;
		}
		throw err;
	}) as PreferencesProfile | null;

	// 古い設定で新しいバックアップを上書きしないようにマージ
	if (backupedProfile != null) {
		currentProfile = mergeProfiles(currentProfile, backupedProfile);
	}

	await misskeyApi('i/registry/set', {
		scope: ['client', 'preferences', 'backups'],
		key: prefer.profile.name,
		value: currentProfile,
	});

	store.set('latestPreferencesBackupAt', Date.now());
}

export async function listCloudBackups() {
	const keys = await misskeyApi('i/registry/keys', {
		scope: ['client', 'preferences', 'backups'],
	});

	return keys.map(k => ({
		name: k,
	}));
}

export async function deleteCloudBackup(key: string) {
	await os.apiWithDialog('i/registry/remove', {
		scope: ['client', 'preferences', 'backups'],
		key,
	});
}

export async function restoreFromCloudBackup() {
	if ($i == null) return;

	// TODO: 更新日時でソートしたい
	const backups = await listCloudBackups();

	if (backups.length === 0) {
		os.alert({
			type: 'warning',
			title: i18n.ts._preferencesBackup.noBackupsFoundTitle,
			text: i18n.ts._preferencesBackup.noBackupsFoundDescription,
		});
		return;
	}

	const select = await os.select({
		title: i18n.ts._preferencesBackup.selectBackupToRestore,
		items: backups.map(backup => ({
			label: backup.name,
			value: backup.name,
		})),
	});
	if (select.canceled) return;
	if (select.result == null) return;

	const profile = await misskeyApi('i/registry/get', {
		scope: ['client', 'preferences', 'backups'],
		key: select.result,
	});

	if (_DEV_) console.log(profile);

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
