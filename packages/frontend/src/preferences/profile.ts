/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, onUnmounted, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import { host, version } from '@@/js/config.js';
import { PREF_DEF } from './def.js';
import type { Ref, WritableComputedRef } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { $i } from '@/account.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';

// NOTE: 明示的な設定値のひとつとして null もあり得るため、設定が存在しないかどうかを判定する目的で null で比較したり ?? を使ってはいけない

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

type PREF = typeof PREF_DEF;
type ValueOf<K extends keyof PREF> = PREF[K]['default'];
type Account = string; // <host>/<userId>

type Cond = Partial<{
	server: string | null; // 将来のため
	account: Account | null;
	device: string | null; // 将来のため
}>;

type ValueMeta = Partial<{
	sync: boolean;
}>;

type PrefRecord<K extends keyof PREF> = [cond: Cond, value: ValueOf<K>, meta: ValueMeta];

function parseCond(cond: Cond): {
	server: string | null;
	account: Account | null;
	device: string | null;
} {
	return {
		server: cond.server ?? null,
		account: cond.account ?? null,
		device: cond.device ?? null,
	};
}

function makeCond(cond: Partial<{
	server: string | null;
	account: Account | null;
	device: string | null;
}>): Cond {
	const c = {} as Cond;
	if (cond.server != null) c.server = cond.server;
	if (cond.account != null) c.account = cond.account;
	if (cond.device != null) c.device = cond.device;
	return c;
}

export function isSameCond(a: Cond, b: Cond): boolean {
	// null と undefined (キー無し) は区別したくないので == で比較
	// eslint-disable-next-line eqeqeq
	return a.server == b.server && a.account == b.account && a.device == b.device;
}

export type PreferencesProfile = {
	id: string;
	version: string;
	type: 'main';
	modifiedAt: number;
	name: string;
	preferences: {
		[K in keyof PREF]: PrefRecord<K>[];
	};
};

export type StorageProvider = {
	save: (ctx: { profile: PreferencesProfile; }) => void;
	cloudGets: <K extends keyof PREF>(ctx: { needs: { key: K; cond: Cond; }[] }) => Promise<Partial<Record<K, ValueOf<K>>>>;
	cloudGet: <K extends keyof PREF>(ctx: { key: K; cond: Cond; }) => Promise<{ value: ValueOf<K>; } | null>;
	cloudSet: <K extends keyof PREF>(ctx: { key: K; cond: Cond; value: ValueOf<K>; }) => Promise<void>;
};

export class ProfileManager {
	private storageProvider: StorageProvider;
	public profile: PreferencesProfile;

	/**
	 * static / state の略 (static が予約語のため)
	 */
	public s = {} as {
		[K in keyof PREF]: ValueOf<K>;
	};

	/**
	 * reactive の略
	 */
	public r = {} as {
		[K in keyof PREF]: Ref<ValueOf<K>>;
	};

	constructor(profile: PreferencesProfile, storageProvider: StorageProvider) {
		this.profile = profile;
		this.storageProvider = storageProvider;

		const states = this.genStates();

		for (const key in states) {
			this.s[key] = states[key];
			this.r[key] = ref(this.s[key]);
		}

		this.fetchCloudValues();

		// TODO: 定期的にクラウドの値をフェッチ
	}

	private rewriteRawState<K extends keyof PREF>(key: K, value: ValueOf<K>) {
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除
		this.r[key].value = this.s[key] = v;
	}

	public commit<K extends keyof PREF>(key: K, value: ValueOf<K>) {
		console.log('prefer:commit', key, value);

		this.rewriteRawState(key, value);

		const record = this.getMatchedRecordOf(key);
		if (parseCond(record[0]).account == null && PREF_DEF[key].accountDependent) {
			this.profile.preferences[key].push([makeCond({
				account: `${host}/${$i!.id}`,
			}), value, {}]);
			this.save();
			return;
		}

		record[1] = value;
		this.save();

		if (record[2].sync) {
			// awaitの必要なし
			// TODO: リクエストを間引く
			this.storageProvider.cloudSet({ key, cond: record[0], value: record[1] });
		}
	}

	/**
	 * 特定のキーの、簡易的なcomputed refを作ります
	 * 主にvue上で設定コントロールのmodelとして使う用
	 */
	public model<K extends keyof PREF, V extends ValueOf<K> = ValueOf<K>>(
		key: K,
		getter?: (v: ValueOf<K>) => V,
		setter?: (v: V) => ValueOf<K>,
	): WritableComputedRef<V> {
		const valueRef = ref(this.s[key]);

		const stop = watch(this.r[key], val => {
			valueRef.value = val;
		});

		// NOTE: vueコンポーネント内で呼ばれない限りは、onUnmounted は無意味なのでメモリリークする
		onUnmounted(() => {
			stop();
		});

		// TODO: VueのcustomRef使うと良い感じになるかも
		return computed({
			get: () => {
				if (getter) {
					return getter(valueRef.value);
				} else {
					return valueRef.value;
				}
			},
			set: (value) => {
				const val = setter ? setter(value) : value;
				this.commit(key, val);
				valueRef.value = val;
			},
		});
	}

	private genStates() {
		const states = {} as { [K in keyof PREF]: ValueOf<K> };
		for (const key in PREF_DEF) {
			const record = this.getMatchedRecordOf(key);
			states[key] = record[1];
		}

		return states;
	}

	private async fetchCloudValues() {
		const needs = [] as { key: keyof PREF; cond: Cond; }[];
		for (const key in PREF_DEF) {
			const record = this.getMatchedRecordOf(key);
			if (record[2].sync) {
				needs.push({
					key,
					cond: record[0],
				});
			}
		}

		const cloudValues = await this.storageProvider.cloudGets({ needs });

		for (const key in PREF_DEF) {
			const record = this.getMatchedRecordOf(key);
			if (record[2].sync && Object.hasOwn(cloudValues, key) && cloudValues[key] !== undefined) {
				const cloudValue = cloudValues[key];
				if (cloudValue !== this.s[key]) {
					this.rewriteRawState(key, cloudValue);
					record[1] = cloudValue;
					console.log('cloud fetched', key, cloudValue);
				}
			}
		}

		this.save();
		console.log('cloud fetch completed');
	}

	public static newProfile(): PreferencesProfile {
		const data = {} as PreferencesProfile['preferences'];
		for (const key in PREF_DEF) {
			data[key] = [[makeCond({}), PREF_DEF[key].default, {}]];
		}
		return {
			id: uuid(),
			version: version,
			type: 'main',
			modifiedAt: Date.now(),
			name: '',
			preferences: data,
		};
	}

	public static normalizeProfile(profileLike: any): PreferencesProfile {
		const data = {} as PreferencesProfile['preferences'];
		for (const key in PREF_DEF) {
			const records = profileLike.preferences[key];
			if (records == null || records.length === 0) {
				data[key] = [[makeCond({}), PREF_DEF[key].default, {}]];
				continue;
			} else {
				data[key] = records;

				// alpha段階ではmetaが無かったのでマイグレート
				// TODO: そのうち消す
				for (const record of data[key] as any[][]) {
					if (record.length === 2) {
						record.push({});
					}
				}
			}
		}

		return {
			...profileLike,
			preferences: data,
		};
	}

	public save() {
		this.profile.modifiedAt = Date.now();
		this.profile.version = version;
		this.storageProvider.save({ profile: this.profile });
	}

	public getMatchedRecordOf<K extends keyof PREF>(key: K): PrefRecord<K> {
		const records = this.profile.preferences[key];

		if ($i == null) return records.find(([cond, v]) => parseCond(cond).account == null)!;

		const accountOverrideRecord = records.find(([cond, v]) => parseCond(cond).account === `${host}/${$i!.id}`);
		if (accountOverrideRecord) return accountOverrideRecord;

		const record = records.find(([cond, v]) => parseCond(cond).account == null);
		return record!;
	}

	public isAccountOverrided<K extends keyof PREF>(key: K): boolean {
		if ($i == null) return false;
		return this.profile.preferences[key].some(([cond, v]) => parseCond(cond).account === `${host}/${$i!.id}`) ?? false;
	}

	public setAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PREF_DEF[key].accountDependent) throw new Error('already account-dependent');
		if (this.isAccountOverrided(key)) return;

		const records = this.profile.preferences[key];
		records.push([makeCond({
			account: `${host}/${$i!.id}`,
		}), this.s[key], {}]);

		this.save();
	}

	public clearAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PREF_DEF[key].accountDependent) throw new Error('cannot clear override for this account-dependent property');

		const records = this.profile.preferences[key];

		const index = records.findIndex(([cond, v]) => parseCond(cond).account === `${host}/${$i!.id}`);
		if (index === -1) return;

		records.splice(index, 1);

		this.rewriteRawState(key, this.getMatchedRecordOf(key)[1]);

		this.save();
	}

	public isSyncEnabled<K extends keyof PREF>(key: K): boolean {
		return this.getMatchedRecordOf(key)[2].sync ?? false;
	}

	public async enableSync<K extends keyof PREF>(key: K): Promise<{ enabled: boolean; } | null> {
		if (this.isSyncEnabled(key)) return Promise.resolve(null);

		const record = this.getMatchedRecordOf(key);

		const existing = await this.storageProvider.cloudGet({ key, cond: record[0] });
		if (existing != null) {
			const { canceled, result } = await os.select({
				title: i18n.ts.preferenceSyncConflictTitle,
				text: i18n.ts.preferenceSyncConflictText,
				items: [{
					text: i18n.ts.preferenceSyncConflictChoiceServer,
					value: 'remote',
				}, {
					text: i18n.ts.preferenceSyncConflictChoiceDevice,
					value: 'local',
				}, {
					text: i18n.ts.preferenceSyncConflictChoiceCancel,
					value: null,
				}],
				default: 'remote',
			});
			if (canceled || result == null) return { enabled: false };

			if (result === 'remote') {
				this.commit(key, existing.value);
			} else if (result === 'local') {
				// nop
			}
		}

		record[2].sync = true;
		this.save();

		// awaitの必要性は無い
		this.storageProvider.cloudSet({ key, cond: record[0], value: this.s[key] });

		return { enabled: true };
	}

	public disableSync<K extends keyof PREF>(key: K) {
		if (!this.isSyncEnabled(key)) return;

		const record = this.getMatchedRecordOf(key);
		delete record[2].sync;
		this.save();
	}

	public renameProfile(name: string) {
		this.profile.name = name;
		this.save();
	}

	public rewriteProfile(profile: PreferencesProfile) {
		this.profile = profile;
		const states = this.genStates();
		for (const key in states) {
			this.rewriteRawState(key, states[key]);
		}

		this.fetchCloudValues();
	}

	public getPerPrefMenu<K extends keyof PREF>(key: K): MenuItem[] {
		const overrideByAccount = ref(this.isAccountOverrided(key));
		watch(overrideByAccount, () => {
			if (overrideByAccount.value) {
				this.setAccountOverride(key);
			} else {
				this.clearAccountOverride(key);
			}
		});

		const sync = ref(this.isSyncEnabled(key));
		watch(sync, () => {
			if (sync.value) {
				this.enableSync(key).then((res) => {
					if (res == null) return;
					if (!res.enabled) sync.value = false;
				});
			} else {
				this.disableSync(key);
			}
		});

		return [{
			icon: 'ti ti-copy',
			text: i18n.ts.copyPreferenceId,
			action: () => {
				copyToClipboard(key);
			},
		}, {
			icon: 'ti ti-refresh',
			text: i18n.ts.resetToDefaultValue,
			danger: true,
			action: () => {
				this.commit(key, PREF_DEF[key].default);
			},
		}, {
			type: 'divider',
		}, {
			type: 'switch',
			icon: 'ti ti-user-cog',
			text: i18n.ts.overrideByAccount,
			ref: overrideByAccount,
		}, {
			type: 'switch',
			icon: 'ti ti-cloud-cog',
			text: i18n.ts.syncBetweenDevices,
			ref: sync,
		}];
	}
}
