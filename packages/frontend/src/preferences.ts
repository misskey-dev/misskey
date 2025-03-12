/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { v4 as uuid } from 'uuid';
import type { PreferencesProfile, StorageProvider } from '@/preferences/manager.js';
import { cloudBackup } from '@/preferences/utility.js';
import { miLocalStorage } from '@/local-storage.js';
import { isSameCond, ProfileManager } from '@/preferences/manager.js';
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

const syncGroup = 'default';

const storageProvider: StorageProvider = {
	save: (ctx) => {
		miLocalStorage.setItem('preferences', JSON.stringify(ctx.profile));
		miLocalStorage.setItem('latestPreferencesUpdate', `${TAB_ID}/${Date.now()}`);
	},

	cloudGet: async (ctx) => {
		// TODO: この取得方法だとアカウントが変わると保存場所も変わってしまうので改修する
		// 例えば複数アカウントある場合でも設定値を保存するための「プライマリアカウント」を設定できるようにするとか
		try {
			const cloudData = await misskeyApi('i/registry/get', {
				scope: ['client', 'preferences', 'sync'],
				key: syncGroup + ':' + ctx.key,
			}) as [any, any][];
			const target = cloudData.find(([cond]) => isSameCond(cond, ctx.cond));
			if (target == null) return null;
			return {
				value: target[1],
			};
		} catch (err: any) {
			if (err.code === 'NO_SUCH_KEY') { // TODO: いちいちエラーキャッチするのは面倒なのでキーが無くてもエラーにならない maybe-get のようなエンドポイントをバックエンドに実装する
				return null;
			} else {
				throw err;
			}
		}
	},

	cloudSet: async (ctx) => {
		let cloudData: [any, any][] = [];
		try {
			cloudData = await misskeyApi('i/registry/get', {
				scope: ['client', 'preferences', 'sync'],
				key: syncGroup + ':' + ctx.key,
			}) as [any, any][];
		} catch (err: any) {
			if (err.code === 'NO_SUCH_KEY') { // TODO: いちいちエラーキャッチするのは面倒なのでキーが無くてもエラーにならない maybe-get のようなエンドポイントをバックエンドに実装する
				cloudData = [];
			} else {
				throw err;
			}
		}

		const i = cloudData.findIndex(([cond]) => isSameCond(cond, ctx.cond));

		if (i === -1) {
			cloudData.push([ctx.cond, ctx.value]);
		} else {
			cloudData[i] = [ctx.cond, ctx.value];
		}

		await misskeyApi('i/registry/set', {
			scope: ['client', 'preferences', 'sync'],
			key: syncGroup + ':' + ctx.key,
			value: cloudData,
		});
	},

	cloudGets: async (ctx) => {
		// TODO: 値の取得を1つのリクエストで済ませたい(バックエンド側でAPIの新設が必要)
		const fetchings = ctx.needs.map(need => storageProvider.cloudGet(need).then(res => [need.key, res] as const));
		const cloudDatas = await Promise.all(fetchings);

		const res = {} as Partial<Record<string, any>>;
		for (const cloudData of cloudDatas) {
			if (cloudData[1] != null) {
				res[cloudData[0]] = cloudData[1].value;
			}
		}

		return res;
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
