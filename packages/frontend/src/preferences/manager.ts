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
import { $i } from '@/i.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { deepEqual } from '@/utility/deep-equal.js';

// NOTE: 明示的な設定値のひとつとして null もあり得るため、設定が存在しないかどうかを判定する目的で null で比較したり ?? を使ってはいけない

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

type PREF = typeof PREF_DEF;
type DefaultValues = {
	[K in keyof PREF]: PREF[K]['default'] extends (...args: any) => infer R ? R : PREF[K]['default'];
};
type ValueOf<K extends keyof PREF> = DefaultValues[K];

type Scope = Partial<{
	server: string | null; // host
	account: string | null; // userId
	device: string | null; // 将来のため
}>;

type ValueMeta = Partial<{
	sync: boolean;
}>;

type PrefRecord<K extends keyof PREF> = [scope: Scope, value: ValueOf<K>, meta: ValueMeta];

function parseScope(scope: Scope): {
	server: string | null;
	account: string | null;
	device: string | null;
} {
	return {
		server: scope.server ?? null,
		account: scope.account ?? null,
		device: scope.device ?? null,
	};
}

function makeScope(scope: Partial<{
	server: string | null;
	account: string | null;
	device: string | null;
}>): Scope {
	const c = {} as Scope;
	if (scope.server != null) c.server = scope.server;
	if (scope.account != null) c.account = scope.account;
	if (scope.device != null) c.device = scope.device;
	return c;
}

export function isSameScope(a: Scope, b: Scope): boolean {
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
	cloudGetBulk: <K extends keyof PREF>(ctx: { needs: { key: K; scope: Scope; }[] }) => Promise<Partial<Record<K, ValueOf<K>>>>;
	cloudGet: <K extends keyof PREF>(ctx: { key: K; scope: Scope; }) => Promise<{ value: ValueOf<K>; } | null>;
	cloudSet: <K extends keyof PREF>(ctx: { key: K; scope: Scope; value: ValueOf<K>; }) => Promise<void>;
};

type PreferencesDefinitionRecord<Default, T = Default extends (...args: any) => infer R ? R : Default> = {
	default: Default;
	accountDependent?: boolean;
	serverDependent?: boolean;
	mergeStrategy?: (a: T, b: T) => T;
};

export type PreferencesDefinition = Record<string, PreferencesDefinitionRecord<any>>;

export function getInitialPrefValue<K extends keyof PREF>(k: K): ValueOf<K> {
	if (typeof PREF_DEF[k].default === 'function') { // factory
		return PREF_DEF[k].default();
	} else {
		return PREF_DEF[k].default;
	}
}

// TODO: PreferencesManagerForGuest のような非ログイン専用のクラスを分離すれば$iのnullチェックやaccountがnullであるスコープのレコード挿入などが不要になり綺麗になるかもしれない
// NOTE: accountDependentな設定は初期状態であってもアカウントごとのスコープでレコードを作成しておかないと、サーバー同期する際に正しく動作しなくなる
export class PreferencesManager {
	private storageProvider: StorageProvider;
	public profile: PreferencesProfile;
	public cloudReady: Promise<void>;

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

		this.cloudReady = this.fetchCloudValues();

		// TODO: 定期的にクラウドの値をフェッチ
	}

	private static isAccountDependentKey<K extends keyof PREF>(key: K): boolean {
		return (PREF_DEF as PreferencesDefinition)[key].accountDependent === true;
	}

	private static isServerDependentKey<K extends keyof PREF>(key: K): boolean {
		return (PREF_DEF as PreferencesDefinition)[key].serverDependent === true;
	}

	private rewriteRawState<K extends keyof PREF>(key: K, value: ValueOf<K>) {
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除
		this.r[key].value = this.s[key] = v;
	}

	public commit<K extends keyof PREF>(key: K, value: ValueOf<K>) {
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除

		if (deepEqual(this.s[key], v)) {
			if (_DEV_) console.log('(skip) prefer:commit', key, v);
			return;
		}

		if (_DEV_) console.log('prefer:commit', key, v);

		this.rewriteRawState(key, v);

		const record = this.getMatchedRecordOf(key);

		if (parseScope(record[0]).account == null && PreferencesManager.isAccountDependentKey(key)) {
			this.profile.preferences[key].push([makeScope({
				server: host,
				account: $i!.id,
			}), v, {}]);
			this.save();
			return;
		}

		if (parseScope(record[0]).server == null && PreferencesManager.isServerDependentKey(key)) {
			this.profile.preferences[key].push([makeScope({
				server: host,
			}), v, {}]);
			this.save();
			return;
		}

		record[1] = v;
		this.save();

		if (record[2].sync) {
			// awaitの必要なし
			// TODO: リクエストを間引く
			this.storageProvider.cloudSet({ key, scope: record[0], value: record[1] });
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
		for (const _key in PREF_DEF) {
			const key = _key as keyof PREF;
			const record = this.getMatchedRecordOf(key);
			(states[key] as any) = record[1];
		}

		return states;
	}

	private async fetchCloudValues() {
		const needs = [] as { key: keyof PREF; scope: Scope; }[];
		for (const _key in PREF_DEF) {
			const key = _key as keyof PREF;
			const record = this.getMatchedRecordOf(key);
			if (record[2].sync) {
				needs.push({
					key,
					scope: record[0],
				});
			}
		}

		const cloudValues = await this.storageProvider.cloudGetBulk({ needs });

		for (const _key in PREF_DEF) {
			const key = _key as keyof PREF;
			const record = this.getMatchedRecordOf(key);
			if (record[2].sync && Object.hasOwn(cloudValues, key) && cloudValues[key] !== undefined) {
				const cloudValue = cloudValues[key];
				if (!deepEqual(cloudValue, record[1])) {
					this.rewriteRawState(key, cloudValue);
					record[1] = cloudValue;
					if (_DEV_) console.log('cloud fetched', key, cloudValue);
				}
			}
		}

		this.save();
		if (_DEV_) console.log('cloud fetch completed');
	}

	public static newProfile(): PreferencesProfile {
		const data = {} as PreferencesProfile['preferences'];
		for (const key in PREF_DEF) {
			const v = getInitialPrefValue(key as keyof typeof PREF_DEF);
			if (PreferencesManager.isAccountDependentKey(key as keyof typeof PREF_DEF)) {
				data[key] = $i ? [[makeScope({}), v, {}], [makeScope({
					server: host,
					account: $i.id,
				}), v, {}]] : [[makeScope({}), v, {}]];
			} else if (PreferencesManager.isServerDependentKey(key as keyof typeof PREF_DEF)) {
				data[key] = [[makeScope({
					server: host,
				}), v, {}]];
			} else {
				data[key] = [[makeScope({}), v, {}]];
			}
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
				const v = getInitialPrefValue(key as keyof typeof PREF_DEF);
				if (PreferencesManager.isAccountDependentKey(key as keyof typeof PREF_DEF)) {
					data[key] = $i ? [[makeScope({}), v, {}], [makeScope({
						server: host,
						account: $i.id,
					}), v, {}]] : [[makeScope({}), v, {}]];
				} else if (PreferencesManager.isServerDependentKey(key as keyof typeof PREF_DEF)) {
					data[key] = [[makeScope({
						server: host,
					}), v, {}]];
				} else {
					data[key] = [[makeScope({}), v, {}]];
				}
				continue;
			} else {
				if ($i && PreferencesManager.isAccountDependentKey(key as keyof typeof PREF_DEF) && !records.some(([scope]) => parseScope(scope).server === host && parseScope(scope).account === $i!.id)) {
					data[key] = records.concat([[makeScope({
						server: host,
						account: $i.id,
					}), getInitialPrefValue(key as keyof typeof PREF_DEF), {}]]);
					continue;
				}
				if ($i && PreferencesManager.isServerDependentKey(key as keyof typeof PREF_DEF) && !records.some(([scope]) => parseScope(scope).server === host)) {
					data[key] = records.concat([[makeScope({
						server: host,
					}), getInitialPrefValue(key as keyof typeof PREF_DEF), {}]]);
					continue;
				}

				data[key] = records;
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

		if ($i == null) return records.find(([scope, v]) => parseScope(scope).account == null)!;

		const accountOverrideRecord = records.find(([scope, v]) => parseScope(scope).server === host && parseScope(scope).account === $i!.id);
		if (accountOverrideRecord) return accountOverrideRecord;

		const serverOverrideRecord = records.find(([scope, v]) => parseScope(scope).server === host && parseScope(scope).account == null);
		if (serverOverrideRecord) return serverOverrideRecord;

		const record = records.find(([scope, v]) => parseScope(scope).account == null);
		return record!;
	}

	public isAccountOverrided<K extends keyof PREF>(key: K): boolean {
		if ($i == null) return false;
		return this.profile.preferences[key].some(([scope, v]) => parseScope(scope).server === host && parseScope(scope).account === $i!.id) ?? false;
	}

	public setAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PreferencesManager.isAccountDependentKey(key)) throw new Error('already account-dependent');
		if (this.isAccountOverrided(key)) return;

		const records = this.profile.preferences[key];
		records.push([makeScope({
			server: host,
			account: $i!.id,
		}), this.s[key], {}]);

		this.save();
	}

	public clearAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PreferencesManager.isAccountDependentKey(key)) throw new Error('cannot clear override for this account-dependent property');

		const records = this.profile.preferences[key];

		const index = records.findIndex(([scope, v]) => parseScope(scope).server === host && parseScope(scope).account === $i!.id);
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

		// undefined ... cancel
		async function resolveConflict(local: ValueOf<K>, remote: ValueOf<K>): Promise<ValueOf<K> | undefined> {
			const merge = (PREF_DEF as PreferencesDefinition)[key].mergeStrategy;
			let mergedValue: ValueOf<K> | undefined = undefined; // null と区別したいため
			try {
				if (merge != null) mergedValue = merge(local, remote);
			} catch (err) {
				// nop
			}
			const { canceled, result: choice } = await os.select({
				title: i18n.ts.preferenceSyncConflictTitle,
				text: i18n.ts.preferenceSyncConflictText,
				items: [...(mergedValue !== undefined ? [{
					text: i18n.ts.preferenceSyncConflictChoiceMerge,
					value: 'merge',
				}] : []), {
					text: i18n.ts.preferenceSyncConflictChoiceServer,
					value: 'remote',
				}, {
					text: i18n.ts.preferenceSyncConflictChoiceDevice,
					value: 'local',
				}, {
					text: i18n.ts.preferenceSyncConflictChoiceCancel,
					value: null,
				}],
				default: mergedValue !== undefined ? 'merge' : 'remote',
			});
			if (canceled || choice == null) return undefined;

			if (choice === 'remote') {
				return remote;
			} else if (choice === 'local') {
				return local;
			} else if (choice === 'merge') {
				return mergedValue!;
			}
		}

		const record = this.getMatchedRecordOf(key);

		let newValue = record[1];

		const existing = await this.storageProvider.cloudGet({ key, scope: record[0] });
		if (existing != null && !deepEqual(record[1], existing.value)) {
			const resolvedValue = await resolveConflict(record[1], existing.value);
			if (resolvedValue === undefined) return { enabled: false }; // canceled
			newValue = resolvedValue;
		}

		this.commit(key, newValue);

		const done = os.waiting();

		try {
			await this.storageProvider.cloudSet({ key, scope: record[0], value: newValue });
		} catch (err) {
			done();

			os.alert({
				type: 'error',
				title: i18n.ts.somethingHappened,
				text: err,
			});

			return { enabled: false };
		}

		done({ success: true });

		record[2].sync = true;
		this.save();

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
		for (const _key in states) {
			const key = _key as keyof PREF;
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
				this.commit(key, getInitialPrefValue(key));
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
