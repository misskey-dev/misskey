/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuid } from 'uuid';
import { apiUrl } from '@@/js/config.js';
import * as Misskey from 'misskey-js';
import { miLocalStorage } from '@/local-storage.js';
import { ProfileManager } from '@/preferences/profile.js';
import { defaultStore } from '@/store.js';
import { $i } from '@/account.js';
import { misskeyApi } from '@/scripts/misskey-api.js';

const TAB_ID = uuid();

function createProfileManager() {
	const currentProfileRaw = miLocalStorage.getItem('preferences');
	const currentProfile = currentProfileRaw ? ProfileManager.normalizeProfile(JSON.parse(currentProfileRaw)) : ProfileManager.newProfile();
	if (currentProfileRaw == null) {
		miLocalStorage.setItem('preferences', JSON.stringify(currentProfile));
	}

	return new ProfileManager(currentProfile);
}

export const profileManager = createProfileManager();
profileManager.addListener('updated', ({ profile: p }) => {
	miLocalStorage.setItem('preferences', JSON.stringify(p));
	miLocalStorage.setItem('latestPreferencesUpdate', `${TAB_ID}/${Date.now()}`);
});
export const prefer = profileManager.store;

let latestSyncedAt = Date.now();

function syncBetweenTabs() {
	const latest = miLocalStorage.getItem('latestPreferencesUpdate');
	if (latest == null) return;

	const latestTab = latest.split('/')[0];
	const latestAt = parseInt(latest.split('/')[1]);

	if (latestTab === TAB_ID) return;
	if (latestAt <= latestSyncedAt) return;

	profileManager.rewriteProfile(ProfileManager.normalizeProfile(JSON.parse(miLocalStorage.getItem('preferences')!)));

	latestSyncedAt = Date.now();

	if (_DEV_) console.log('prefer:synced');
}

window.setInterval(syncBetweenTabs, 5000);

document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible') {
		syncBetweenTabs();
	}
});

const BACKUP_FOLER_NAME = 'Misskey Preferences Backups';

let latestBackupAt = 0;

async function cloudBackup() {
	if ($i == null) return;

	const fileName = `${profileManager.profile.name || profileManager.profile.id}.misskeypreferences`;

	let folder = (await misskeyApi('drive/folders/find', {
		name: BACKUP_FOLER_NAME,
	}))[0] as Misskey.entities.DriveFolder | null;

	if (folder) {
		const existingFiles = await misskeyApi('drive/files/find', {
			name: fileName,
			folderId: folder.id,
		});
		if (existingFiles.length > 0) {
			for (const file of existingFiles) {
				misskeyApi('drive/files/delete', {
					fileId: file.id,
				});
			}
		}
	} else {
		folder = await misskeyApi('drive/folders/create', {
			name: BACKUP_FOLER_NAME,
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
	});

	latestBackupAt = Date.now();
}

window.setInterval(() => {
	if (!defaultStore.state.enablePreferencesAutoCloudBackup) return;
	if (document.visibilityState !== 'visible') return; // 同期されていない古い値がバックアップされるのを防ぐ
	if (profileManager.profile.modifiedAt <= latestBackupAt) return;

	cloudBackup();
}, 1000 * 60 * 3);

if (_DEV_) {
	(window as any).profileManager = profileManager;
	(window as any).prefer = prefer;
	(window as any).cloudBackup = cloudBackup;
}
