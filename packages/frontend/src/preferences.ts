/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuid } from 'uuid';
import type { PreferencesProfile, StorageProvider } from '@/preferences/profile.js';
import { cloudBackup } from '@/preferences/utility.js';
import { miLocalStorage } from '@/local-storage.js';
import { ProfileManager } from '@/preferences/profile.js';
import { store } from '@/store.js';
import { $i } from '@/account.js';
import { misskeyApi } from '@/utility/misskey-api.js';

const TAB_ID = uuid();

function createProfileManager(storageProvider: StorageProvider) {
	let profile: PreferencesProfile;

	const savedProfileRaw = miLocalStorage.getItem('preferences');
	if (savedProfileRaw == null) {
		profile = ProfileManager.newProfile();
		miLocalStorage.setItem('preferences', JSON.stringify(profile));
	} else {
		profile = ProfileManager.normalizeProfile(JSON.parse(savedProfileRaw));
	}

	return new ProfileManager(profile, storageProvider);
}

const storageProvider: StorageProvider = {
	save: (ctx) => {
		miLocalStorage.setItem('preferences', JSON.stringify(ctx.profile));
		miLocalStorage.setItem('latestPreferencesUpdate', `${TAB_ID}/${Date.now()}`);
	},
	cloudGet: async (ctx) => {
		// TODO: この取得方法だとアカウントが変わると保存場所も変わってしまうので改修する
		// 例えば複数アカウントある場合でも設定値を保存するための「プライマリアカウント」を設定できるようにするとか
		// TODO: keyのcondに応じた取得
		try {
			const value = await misskeyApi('i/registry/get', {
				scope: ['client', 'preferences', 'sync'],
				key: ctx.key,
			});
			return {
				value,
			};
		} catch (err: any) {
			if (err.code === 'NO_SUCH_KEY') {
				return null;
			} else {
				throw err;
			}
		}
	},
	cloudSet: async (ctx) => {
		await misskeyApi('i/registry/set', {
			scope: ['client', 'preferences', 'sync'],
			key: ctx.key,
			value: ctx.value,
		});
	},
};

export const prefer = createProfileManager(storageProvider);

let latestSyncedAt = Date.now();

function syncBetweenTabs() {
	const latest = miLocalStorage.getItem('latestPreferencesUpdate');
	if (latest == null) return;

	const latestTab = latest.split('/')[0];
	const latestAt = parseInt(latest.split('/')[1]);

	if (latestTab === TAB_ID) return;
	if (latestAt <= latestSyncedAt) return;

	prefer.rewriteProfile(ProfileManager.normalizeProfile(JSON.parse(miLocalStorage.getItem('preferences')!)));

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
	if (!store.s.enablePreferencesAutoCloudBackup) return;
	if (document.visibilityState !== 'visible') return; // 同期されていない古い値がバックアップされるのを防ぐ
	if (prefer.profile.modifiedAt <= latestBackupAt) return;

	cloudBackup().then(() => {
		latestBackupAt = Date.now();
	});
}, 1000 * 60 * 3);

if (_DEV_) {
	(window as any).prefer = prefer;
	(window as any).cloudBackup = cloudBackup;
}
