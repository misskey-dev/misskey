/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuid } from 'uuid';
import { miLocalStorage } from '@/local-storage.js';
import { ProfileManager } from '@/preferences/profile.js';

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

// TODO: auto backup

if (_DEV_) {
	(window as any).profileManager = profileManager;
	(window as any).prefer = prefer;
}
