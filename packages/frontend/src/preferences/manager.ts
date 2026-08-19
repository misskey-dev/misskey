/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { customRef, ref, watch, onScopeDispose } from 'vue';
import { EventEmitter } from 'eventemitter3';
import { host, version } from '@@/js/config.js';
import { PREF_DEF } from './def.js';
import type { Ref } from 'vue';
import type { MenuItem } from '@/types/menu.js';
import { genId } from '@/utility/id.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';
import * as os from '@/os.js';
import { deepEqual } from '@/utility/deep-equal.js';
import { deepClone } from '@/utility/clone.js';

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
	// TODO: デバイスの時計がずれていた場合に不具合のもとになるため、対策を考える
	modifiedAt?: number; // 設定値を変更した日時。同期した日時などではない。つまり別のデバイスでA日に変更したものをB日に同期して取得したとしてもmodifiedAtはA日である必要がある
	syncModifiedAt?: number; // syncを変更した日時。設定値のmodifiedAtとは独立して管理する(syncの変更をmodifiedAtに反映すると状況によっては古い設定値で新しい設定値が上書きされる可能性があるため)
	deleted: boolean; // 削除済みの設定値を同期時に他のデバイスに伝播させるためのtombstone
}>;

type PrefRecord<K extends keyof PREF> = [scope: Scope, value: ValueOf<K>, meta: ValueMeta];

function isDeletedRecord(record: [scope: Scope, value: any, meta?: ValueMeta]): boolean {
	return record[2]?.deleted === true;
}

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
	modifiedAt: number; // 仕様が若干直感的ではない(syncされた値が降ってきたときは更新されないなど)ため、一応残してはいるが積極的な利用はしない方が無難。設定値の新旧比較が必要なら項目ごとのmodifiedAtを使うべし
	name: string;
	preferences: {
		[K in keyof PREF]: PrefRecord<K>[];
	};
};

export type PossiblyNonNormalizedPreferencesProfile = Omit<PreferencesProfile, 'preferences'> & {
	preferences: Record<string, [scope: Scope, value: any, meta: ValueMeta][]>;
};

export type StorageProvider = {
	load: () => PossiblyNonNormalizedPreferencesProfile | null;
	save: (ctx: { profile: PreferencesProfile; }) => void;
	cloudGetBulk: <K extends keyof PREF>(ctx: { needs: { key: K; scope: Scope; }[] }) => Promise<Partial<Record<K, { value: ValueOf<K>; meta: { modifiedAt: ValueMeta['modifiedAt'] }; }>>>;
	cloudGet: <K extends keyof PREF>(ctx: { key: K; scope: Scope; }) => Promise<{ value: ValueOf<K>; meta: { modifiedAt: ValueMeta['modifiedAt'] }; } | null>;
	cloudSet: <K extends keyof PREF>(ctx: { key: K; scope: Scope; value: ValueOf<K>; meta: { modifiedAt: ValueMeta['modifiedAt'] }; }) => Promise<void>;
};

type PreferencesDefinitionRecord<Default, T = Default extends (...args: any) => infer R ? R : Default> = {
	default: Default;
	accountDependent?: boolean;
	serverDependent?: boolean;
	mergeStrategy?: (a: T, b: T) => T;
};

export type PreferencesDefinition = Record<string, PreferencesDefinitionRecord<any>>;

export function definePreferences<T extends Record<string, unknown>>(x: {
	[K in keyof T]: PreferencesDefinitionRecord<T[K]>
}): {
	[K in keyof T]: PreferencesDefinitionRecord<T[K]>
} {
	return x;
}

export function getInitialPrefValue<K extends keyof PREF>(k: K): ValueOf<K> {
	const _default = PREF_DEF[k].default;
	if (typeof _default === 'function') { // factory
		return _default() as ValueOf<K>;
	} else {
		// 参照渡しになるのを防ぐためclone
		return deepClone(_default as unknown as ValueOf<K>);
	}
}

function isAccountDependentKey<K extends keyof PREF>(key: K): boolean {
	return (PREF_DEF as PreferencesDefinition)[key].accountDependent === true;
}

function isServerDependentKey<K extends keyof PREF>(key: K): boolean {
	return (PREF_DEF as PreferencesDefinition)[key].serverDependent === true;
}

function createEmptyProfile(): PossiblyNonNormalizedPreferencesProfile {
	return {
		id: genId(),
		version: version,
		type: 'main',
		modifiedAt: Date.now(),
		name: '',
		preferences: {},
	};
}

function normalizePreferences(preferences: PossiblyNonNormalizedPreferencesProfile['preferences'], account: { id: string } | null): PreferencesProfile['preferences'] {
	const data = { ...preferences } as Record<string, [scope: Scope, value: any, meta: ValueMeta][]>;
	for (const key in PREF_DEF) {
		const records = preferences[key];
		if (records == null || records.length === 0) {
			const v = getInitialPrefValue(key as keyof typeof PREF_DEF);
			if (isAccountDependentKey(key as keyof typeof PREF_DEF)) {
				data[key] = account ? [[makeScope({}), v, {}], [makeScope({
					server: host,
					account: account.id,
				}), v, {}]] : [[makeScope({}), v, {}]];
			} else if (isServerDependentKey(key as keyof typeof PREF_DEF)) {
				data[key] = [[makeScope({
					server: host,
				}), v, {}]];
			} else {
				data[key] = [[makeScope({}), v, {}]];
			}
			continue;
		} else {
			if (account && isAccountDependentKey(key as keyof typeof PREF_DEF) && !records.some((record) => !isDeletedRecord(record) && parseScope(record[0]).server === host && parseScope(record[0]).account === account.id)) {
				data[key] = records.concat([[makeScope({
					server: host,
					account: account.id,
				}), getInitialPrefValue(key as keyof typeof PREF_DEF), {}]]);
				continue;
			}
			if (account && isServerDependentKey(key as keyof typeof PREF_DEF) && !records.some((record) => !isDeletedRecord(record) && parseScope(record[0]).server === host)) {
				data[key] = records.concat([[makeScope({
					server: host,
				}), getInitialPrefValue(key as keyof typeof PREF_DEF), {}]]);
				continue;
			}

			data[key] = records;
		}
	}

	return data as PreferencesProfile['preferences'];
}

// 各recordについて、modifiedAtが大きい方を採用する
// 引数の参照をmutateしないように注意すること
export function mergeProfiles(a: PreferencesProfile, b: PreferencesProfile): PreferencesProfile {
	const merged = {
		...a,
		modifiedAt: Math.max(a.modifiedAt, b.modifiedAt),
		preferences: {},
	} as PreferencesProfile;

	// 片方にない設定項目を許容し、未知の設定項目も保持する
	const keys = new Set([
		...Object.keys(PREF_DEF),
		...Object.keys(a.preferences),
		...Object.keys(b.preferences),
	]);
	const mergedPreferences = merged.preferences as Record<string, [scope: Scope, value: any, meta: ValueMeta][]>;

	for (const key of keys) {
		const aRecords = (a.preferences as Record<string, [scope: Scope, value: any, meta: ValueMeta][]>)[key] ?? [];
		const bRecords = (b.preferences as Record<string, [scope: Scope, value: any, meta: ValueMeta][]>)[key] ?? [];

		const mergedRecords = [...aRecords];

		for (const bRecord of bRecords) {
			const existingIndex = mergedRecords.findIndex(([scope]) => isSameScope(scope, bRecord[0]));
			if (existingIndex === -1) {
				mergedRecords.push(bRecord);
			} else {
				const aRecord = mergedRecords[existingIndex];
				const valueRecord = (bRecord[2]?.modifiedAt ?? 0) > (aRecord[2]?.modifiedAt ?? 0) ? bRecord : aRecord;
				const syncRecord = (bRecord[2]?.syncModifiedAt ?? 0) > (aRecord[2]?.syncModifiedAt ?? 0) ? bRecord : aRecord;

				mergedRecords[existingIndex] = [
					valueRecord[0],
					valueRecord[1],
					{
						...valueRecord[2],
						sync: syncRecord[2]?.sync,
						syncModifiedAt: syncRecord[2]?.syncModifiedAt,
					},
				];
			}
		}

		mergedPreferences[key] = mergedRecords;
	}

	return merged;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
type PreferencesManagerEvents = {
};

// TODO: PreferencesManagerForGuest のような非ログイン専用のクラスを分離すればthis.currentAccountのnullチェックやaccountがnullであるスコープのレコード挿入などが不要になり綺麗になるかもしれない
//       と思ったけど操作アカウントが存在しない場合も考慮する現在の設計の方が汎用的かつ堅牢かもしれない
// NOTE: accountDependentな設定は初期状態であってもアカウントごとのスコープでレコードを作成しておかないと、サーバー同期する際に正しく動作しなくなる
export class PreferencesManager extends EventEmitter<PreferencesManagerEvents> {
	private io: StorageProvider;
	private currentAccount: { id: string } | null;
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

	constructor(io: StorageProvider, currentAccount: { id: string } | null) {
		super();

		this.io = io;
		this.currentAccount = currentAccount;

		const loadedProfile = this.io.load() ?? createEmptyProfile();
		this.profile = {
			...loadedProfile,
			preferences: normalizePreferences(loadedProfile.preferences, currentAccount),
		};

		const states = this.genStates();

		// apply states
		for (const key in states) {
			(this.s[key as keyof PREF] as any) = states[key as keyof PREF];
			(this.r[key as keyof PREF] as Ref<any>) = ref(this.s[key as keyof PREF]);
		}

		// normalizeの結果変わっていたら保存
		if (!deepEqual(loadedProfile, this.profile)) {
			this.save();
		}

		this.cloudReady = this.fetchCloudValues();

		// TODO: 定期的にクラウドの値をフェッチ
	}

	private rewriteRawState<K extends keyof PREF>(key: K, value: ValueOf<K>) {
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除
		this.r[key].value = this.s[key] = v;
	}

	// TODO: desync対策 cloudの値のfetchが正常に完了していない状態でcommitすると多分値が上書きされる
	public commit<K extends keyof PREF>(key: K, value: ValueOf<K>): PrefRecord<K> | null {
		const currentAccount = this.currentAccount; // TSを黙らせるため
		const v = JSON.parse(JSON.stringify(value)); // deep copy 兼 vueのプロキシ解除

		if (deepEqual(this.s[key], v)) {
			if (_DEV_) console.log('(skip) prefer:commit', key, v);
			return null;
		}

		if (_DEV_) console.log('prefer:commit', key, v);

		this.rewriteRawState(key, v);

		const record = this.getMatchedRecordOf(key);

		if (parseScope(record[0]).account == null && isAccountDependentKey(key) && currentAccount != null) {
			const newRecord = [makeScope({
				server: host,
				account: currentAccount.id,
			}), v, {
				modifiedAt: Date.now(),
			}] as PrefRecord<K>;
			this.profile.preferences[key].push(newRecord);
			this.save();
			return newRecord;
		}

		if (parseScope(record[0]).server == null && isServerDependentKey(key)) {
			const newRecord = [makeScope({
				server: host,
			}), v, {
				modifiedAt: Date.now(),
			}] as PrefRecord<K>;
			this.profile.preferences[key].push(newRecord);
			this.save();
			return newRecord;
		}

		record[1] = v;
		record[2].modifiedAt = Date.now();
		this.save();

		if (record[2].sync) {
			// awaitの必要なし
			// TODO: リクエストを間引く
			this.io.cloudSet({ key, scope: record[0], value: record[1], meta: { modifiedAt: record[2].modifiedAt } });
		}

		return record;
	}

	/**
	 * 特定のキーの、簡易的なcomputed refを作ります
	 * 主にvue上で設定コントロールのmodelとして使う用
	 */
	public model<K extends keyof PREF, V = ValueOf<K>>(
		key: K,
	): Ref<V>;
	public model<K extends keyof PREF, V extends Exclude<any, ValueOf<K>>>(
		key: K,
		getter: (v: ValueOf<K>) => V,
		setter: (v: V) => ValueOf<K>,
	): Ref<V>;

	public model<K extends keyof PREF, V>(
		key: K,
		getter?: (v: ValueOf<K>) => V,
		setter?: (v: V) => ValueOf<K>,
	): Ref<V> {
		return customRef<V>((track, trigger) => {
			const watchStop = watch(this.r[key], () => {
				trigger();
			});

			onScopeDispose(() => {
				watchStop();
			}, true);

			return {
				get: () => {
					track();
					return (getter != null ? getter(this.s[key]) : this.s[key]) as V;
				},
				set: (value) => {
					const val = setter != null ? setter(value) : value;
					this.commit(key, val as ValueOf<K>);
				},
			};
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

		const cloudValues = await this.io.cloudGetBulk({ needs });

		let modified = false;
		const cloudUpdates: Promise<void>[] = [];

		for (const _key in PREF_DEF) {
			const key = _key as keyof PREF;
			const record = this.getMatchedRecordOf(key);
			if (record[2].sync && Object.hasOwn(cloudValues, key) && cloudValues[key] !== undefined) {
				const cloudValue = cloudValues[key];
				if (!deepEqual(cloudValue.value, record[1])) {
					const localModifiedAt = record[2].modifiedAt;
					const cloudModifiedAt = cloudValue.meta?.modifiedAt;
					const shouldApplyCloudValue = localModifiedAt == null || (cloudModifiedAt != null && cloudModifiedAt >= localModifiedAt);

					if (shouldApplyCloudValue) {
						this.rewriteRawState(key, cloudValue.value);
						record[1] = cloudValue.value;
						record[2].modifiedAt = cloudModifiedAt;
						modified = true;
						if (_DEV_) console.log('cloud fetched', key, cloudValue);
					} else {
						cloudUpdates.push(this.io.cloudSet({
							key,
							scope: record[0],
							value: record[1],
							meta: { modifiedAt: localModifiedAt },
						}));
						if (_DEV_) console.log('cloud updated', key, record);
					}
				}
			}
		}

		if (modified) this.save();
		await Promise.all(cloudUpdates);

		if (_DEV_) console.log('cloud fetch completed');
	}

	private save() {
		this.profile.modifiedAt = Date.now();
		this.profile.version = version;
		this.io.save({ profile: this.profile });
	}

	public getMatchedRecordOf<K extends keyof PREF>(key: K): PrefRecord<K> {
		const currentAccount = this.currentAccount; // TSを黙らせるため

		const records = this.profile.preferences[key];

		if (currentAccount == null) {
			const record = records.find((record) => !isDeletedRecord(record) && parseScope(record[0]).account == null);

			// 設計上あり得ないけどTSに怒られるため
			if (record == null) throw new Error(`no record found for key: ${key}`);

			return record;
		}

		const accountOverrideRecord = records.find((record) => !isDeletedRecord(record) && parseScope(record[0]).server === host && parseScope(record[0]).account === currentAccount.id);
		if (accountOverrideRecord) return accountOverrideRecord;

		const serverOverrideRecord = records.find((record) => !isDeletedRecord(record) && parseScope(record[0]).server === host && parseScope(record[0]).account == null);
		if (serverOverrideRecord) return serverOverrideRecord;

		const record = records.find((record) => !isDeletedRecord(record) && parseScope(record[0]).account == null);

		// 設計上あり得ないけどTSに怒られるため
		if (record == null) throw new Error(`no record found for key: ${key}`);

		return record;
	}

	public isAccountOverrided<K extends keyof PREF>(key: K): boolean {
		const currentAccount = this.currentAccount; // TSを黙らせるため
		if (currentAccount == null) return false;
		return this.profile.preferences[key].some((record) => !isDeletedRecord(record) && parseScope(record[0]).server === host && parseScope(record[0]).account === currentAccount.id);
	}

	public setAccountOverride<K extends keyof PREF>(key: K) {
		const currentAccount = this.currentAccount; // TSを黙らせるため
		if (currentAccount == null) return;
		if (isAccountDependentKey(key)) throw new Error('already account-dependent');
		if (this.isAccountOverrided(key)) return;

		const records = this.profile.preferences[key];
		const scope = makeScope({
			server: host,
			account: currentAccount.id,
		});
		const deletedRecord = records.find((record) => isSameScope(record[0], scope));
		if (deletedRecord) {
			deletedRecord[1] = this.s[key];
			deletedRecord[2] = { modifiedAt: Date.now() };
		} else {
			records.push([scope, this.s[key], { modifiedAt: Date.now() }]);
		}

		this.save();
	}

	public clearAccountOverride<K extends keyof PREF>(key: K) {
		const currentAccount = this.currentAccount; // TSを黙らせるため
		if (currentAccount == null) return;
		if (isAccountDependentKey(key)) throw new Error('cannot clear override for this account-dependent property');

		const records = this.profile.preferences[key];

		const index = records.findIndex(([scope, v]) => parseScope(scope).server === host && parseScope(scope).account === currentAccount.id);
		if (index === -1) return;

		const record = records[index];
		record[2] = {
			...record[2],
			modifiedAt: Date.now(),
			deleted: true,
		};

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
			} catch (_) {
				// nop
			}
			const { canceled, result: choice } = await os.select({
				title: i18n.ts.preferenceSyncConflictTitle,
				text: i18n.ts.preferenceSyncConflictText,
				items: [...(mergedValue !== undefined ? [{
					label: i18n.ts.preferenceSyncConflictChoiceMerge,
					value: 'merge' as const,
				}] : []), {
					label: i18n.ts.preferenceSyncConflictChoiceServer,
					value: 'remote' as const,
				}, {
					label: i18n.ts.preferenceSyncConflictChoiceDevice,
					value: 'local' as const,
				}, {
					label: i18n.ts.preferenceSyncConflictChoiceCancel,
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
			} else { // TSを黙らすため
				return undefined;
			}
		}

		const record = this.getMatchedRecordOf(key);

		let newValue = record[1];

		const existing = await this.io.cloudGet({ key, scope: record[0] });
		if (existing != null && !deepEqual(record[1], existing.value)) {
			const resolvedValue = await resolveConflict(record[1], existing.value);
			if (resolvedValue === undefined) return { enabled: false }; // canceled
			newValue = resolvedValue;
		}

		this.commit(key, newValue);

		const done = os.waiting();

		try {
			await this.io.cloudSet({ key, scope: record[0], value: newValue, meta: { modifiedAt: record[2].modifiedAt } });
		} catch (err) {
			done();

			os.alert({
				type: 'error',
				title: i18n.ts.somethingHappened,
			});

			console.error(err);

			return { enabled: false };
		}

		done({ success: true });

		record[2].sync = true;
		record[2].syncModifiedAt = Date.now();
		this.save();

		return { enabled: true };
	}

	public disableSync<K extends keyof PREF>(key: K) {
		if (!this.isSyncEnabled(key)) return;

		const record = this.getMatchedRecordOf(key);
		record[2].sync = false;
		record[2].syncModifiedAt = Date.now();
		this.save();
	}

	public renameProfile(name: string) {
		this.profile.name = name;
		// TODO: バックアップのキーが名前ベースであることを考えると名前=IDであるから、idも再生成する方が自然かもしれない
		// (将来名前ではなくIDをキーにするようになったとした場合、名前を変えたのにバックアップのキーが変わらないことになってしまう)
		this.save();
	}

	public reloadProfile() {
		const freshProfile = this.io.load();
		if (freshProfile == null) return;

		this.profile = {
			...freshProfile,
			preferences: normalizePreferences(freshProfile.preferences, this.currentAccount),
		};
		const states = this.genStates();
		for (const _key in states) {
			const key = _key as keyof PREF;
			this.rewriteRawState(key, states[key]);
		}
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
		}, {
			type: 'divider',
		}, {
			type: 'label',
			text: i18n.ts.modifiedAt + ': ' + (this.getMatchedRecordOf(key)[2].modifiedAt ? new Date(this.getMatchedRecordOf(key)[2].modifiedAt!).toLocaleString() : '-'),
		}];
	}
}
