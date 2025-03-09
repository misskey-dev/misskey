/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuid } from 'uuid';
import type { PreferencesProfile } from '@/preferences/profile.js';
import { cloudBackup } from '@/preferences/utility.js';
import { miLocalStorage } from '@/local-storage.js';
import { ProfileManager } from '@/preferences/profile.js';
import { store } from '@/store.js';
import { $i } from '@/account.js';

const TAB_ID = uuid();

function createProfileManager() {
	let profile: PreferencesProfile;

	const savedProfileRaw = miLocalStorage.getItem('preferences');
	if (savedProfileRaw == null) {
		profile = ProfileManager.newProfile();
		miLocalStorage.setItem('preferences', JSON.stringify(profile));
	} else {
		profile = ProfileManager.normalizeProfile(JSON.parse(savedProfileRaw));
	}

	return new ProfileManager(profile);
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

let latestBackupAt = 0;

window.setInterval(() => {
	if ($i == null) return;
	if (!store.state.enablePreferencesAutoCloudBackup) return;
	if (document.visibilityState !== 'visible') return; // 同期されていない古い値がバックアップされるのを防ぐ
	if (profileManager.profile.modifiedAt <= latestBackupAt) return;

	cloudBackup().then(() => {
		latestBackupAt = Date.now();
	});
}, 1000 * 60 * 3);

if (_DEV_) {
	(window as any).profileManager = profileManager;
	(window as any).prefer = prefer;
	(window as any).cloudBackup = cloudBackup;
}
