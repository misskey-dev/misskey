/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import { host, version } from '@@/js/config.js';
import { EventEmitter } from 'eventemitter3';
import { PREF_DEF } from './def.js';
import { Store } from './store.js';
import type { MenuItem } from '@/types/menu.js';
import { $i } from '@/account.js';
import { copyToClipboard } from '@/utility/copy-to-clipboard.js';
import { i18n } from '@/i18n.js';

// NOTE: 明示的な設定値のひとつとして null もあり得るため、設定が存在しないかどうかを判定する目的で null で比較したり ?? を使ってはいけない

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

type PREF = typeof PREF_DEF;
type ValueOf<K extends keyof PREF> = PREF[K]['default'];
type Account = string; // <host>/<userId>

type Cond = {
	server: string | null; // 将来のため
	account: Account | null;
	device: string | null; // 将来のため
};

export type PreferencesProfile = {
	id: string;
	version: string;
	type: 'main';
	modifiedAt: number;
	name: string;
	preferences: {
		[K in keyof PREF]: [Cond, ValueOf<K>][];
	};
	syncByAccount: [Account, keyof PREF][],
};

// TODO: 任意のプロパティをデバイス間で同期できるようにする？

export class ProfileManager extends EventEmitter<{
	updated: (ctx: {
		profile: PreferencesProfile
	}) => void;
}> {
	public profile: PreferencesProfile;
	public store: Store<{
		[K in keyof PREF]: ValueOf<K>;
	}>;

	constructor(profile: PreferencesProfile) {
		super();
		this.profile = profile;

		const states = this.genStates();

		this.store = new Store(states);
		this.store.addListener('updated', ({ key, value }) => {
			console.log('prefer:set', key, value);

			const record = this.getMatchedRecord(key);
			if (record[0].account == null && PREF_DEF[key].accountDependent) {
				this.profile.preferences[key].push([{
					server: null,
					account: `${host}/${$i!.id}`,
					device: null,
				}, value]);
				this.save();
				return;
			}

			record[1] = value;
			this.save();
		});
	}

	private genStates() {
		const states = {} as { [K in keyof PREF]: ValueOf<K> };
		let key: keyof PREF;
		for (key in PREF_DEF) {
			const record = this.getMatchedRecord(key);
			states[key] = record[1];
		}

		return states;
	}

	public static newProfile(): PreferencesProfile {
		const data = {} as PreferencesProfile['preferences'];
		let key: keyof PREF;
		for (key in PREF_DEF) {
			data[key] = [[{
				server: null,
				account: null,
				device: null,
			}, PREF_DEF[key].default]];
		}
		return {
			id: uuid(),
			version: version,
			type: 'main',
			modifiedAt: Date.now(),
			name: '',
			preferences: data,
			syncByAccount: [],
		};
	}

	public static normalizeProfile(profile: any): PreferencesProfile {
		const data = {} as PreferencesProfile['preferences'];
		let key: keyof PREF;
		for (key in PREF_DEF) {
			const records = profile.preferences[key];
			if (records == null || records.length === 0) {
				data[key] = [[{
					server: null,
					account: null,
					device: null,
				}, PREF_DEF[key].default]];
				continue;
			} else {
				data[key] = records;
			}
		}

		return {
			...profile,
			preferences: data,
		};
	}

	public save() {
		this.profile.modifiedAt = Date.now();
		this.profile.version = version;
		this.emit('updated', { profile: this.profile });
	}

	public getMatchedRecord<K extends keyof PREF>(key: K): [Cond, ValueOf<K>] {
		const records = this.profile.preferences[key];

		if ($i == null) return records.find(([cond, v]) => cond.account == null)!;

		const accountOverrideRecord = records.find(([cond, v]) => cond.account === `${host}/${$i!.id}`);
		if (accountOverrideRecord) return accountOverrideRecord;

		const record = records.find(([cond, v]) => cond.account == null);
		return record!;
	}

	public isAccountOverrided<K extends keyof PREF>(key: K): boolean {
		if ($i == null) return false;
		return this.profile.preferences[key].some(([cond, v]) => cond.account === `${host}/${$i!.id}`) ?? false;
	}

	public setAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PREF_DEF[key].accountDependent) throw new Error('already account-dependent');
		if (this.isAccountOverrided(key)) return;

		const records = this.profile.preferences[key];
		records.push([{
			server: null,
			account: `${host}/${$i!.id}`,
			device: null,
		}, this.store.s[key]]);

		this.save();
	}

	public clearAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PREF_DEF[key].accountDependent) throw new Error('cannot clear override for this account-dependent property');

		const records = this.profile.preferences[key];

		const index = records.findIndex(([cond, v]) => cond.account === `${host}/${$i!.id}`);
		if (index === -1) return;

		records.splice(index, 1);

		this.store.rewrite(key, this.getMatchedRecord(key)[1]);

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
			this.store.rewrite(key, states[key]);
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
				this.store.commit(key, PREF_DEF[key].default);
			},
		}, {
			type: 'divider',
		}, {
			type: 'switch',
			icon: 'ti ti-user-cog',
			text: i18n.ts.overrideByAccount,
			ref: overrideByAccount,
		}];
	}
}
