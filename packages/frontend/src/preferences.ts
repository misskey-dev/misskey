/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, onUnmounted, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import * as Misskey from 'misskey-js';
import { host, version } from '@@/js/config.js';
import { hemisphere } from '@@/js/intl-const.js';
import { EventEmitter } from 'eventemitter3';
import { $i } from './account.js';
import { copyToClipboard } from './scripts/copy-to-clipboard.js';
import { i18n } from './i18n.js';
import type { Ref, WritableComputedRef } from 'vue';
import type { Theme } from '@/scripts/theme.js';
import type { SoundType } from '@/scripts/sound.js';
import type { MenuItem } from './types/menu.js';
import { miLocalStorage } from '@/local-storage.js';
import { DEFAULT_DEVICE_KIND } from '@/scripts/device-kind.js';

const TAB_ID = uuid();

// NOTE: 明示的な設定値のひとつとして null もあり得るため、設定が存在しないかどうかを判定する目的で null で比較したり ?? を使ってはいけない

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

type StoreEvent<Data extends Record<string, any>> = {
	updated: <K extends keyof Data>(ctx: {
		key: K;
		value: Data[K];
	}) => void;
};

class Store<Data extends Record<string, any>> extends EventEmitter<StoreEvent<Data>> {
	/**
	 * static の略 (static が予約語のため)
	 */
	public s = {} as {
		[K in keyof Data]: Data[K];
	};

	/**
	 * reactive の略
	 */
	public r = {} as {
		[K in keyof Data]: Ref<Data[K]>;
	};

	constructor(data: { [K in keyof Data]: Data[K] }) {
		super();

		for (const key in data) {
			this.s[key] = data[key];
			this.r[key] = ref(this.s[key]);
		}
	}

	public set<K extends keyof Data>(key: K, value: Data[K]) {
		this.r[key].value = this.s[key] = value;
		this.emit('updated', { key, value });
	}

	public rewrite<K extends keyof Data>(key: K, value: Data[K]) {
		this.r[key].value = this.s[key] = value;
	}

	/**
	 * 特定のキーの、簡易的なcomputed refを作ります
	 * 主にvue上で設定コントロールのmodelとして使う用
	 */
	public model<K extends keyof Data, V extends Data[K] = Data[K]>(
		key: K,
		getter?: (v: Data[K]) => V,
		setter?: (v: V) => Data[K],
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
				this.set(key, val);
				valueRef.value = val;
			},
		});
	}
}

// TODO: accountDependent考慮
// TODO: lazyLoad機能？(ColdDeviceStorage代替)

/** サウンド設定 */
export type SoundStore = {
	type: Exclude<SoundType, '_driveFile_'>;
	volume: number;
} | {
	type: '_driveFile_';

	/** ドライブのファイルID */
	fileId: string;

	/** ファイルURL（こちらが優先される） */
	fileUrl: string;

	volume: number;
};

export const PREF_DEF = {
	pinnedUserLists: {
		accountDependent: true,
		default: [] as Misskey.entities.UserList[],
	},
	uploadFolder: {
		accountDependent: true,
		default: null as string | null,
	},

	lightTheme: {
		default: null as Theme | null,
	},
	darkTheme: {
		default: null as Theme | null,
	},
	syncDeviceDarkMode: {
		default: true,
	},
	defaultNoteVisibility: {
		default: 'public' as (typeof Misskey.noteVisibilities)[number],
	},
	defaultNoteLocalOnly: {
		default: false,
	},
	keepCw: {
		default: true,
	},
	keepOriginalUploading: {
		default: false,
	},
	rememberNoteVisibility: {
		default: false,
	},
	reportError: {
		default: false,
	},
	collapseRenotes: {
		default: true,
	},
	themes: {
		default: [] as Theme[],
	},
	menu: {
		default: [
			'notifications',
			'clips',
			'drive',
			'followRequests',
			'-',
			'explore',
			'announcements',
			'search',
			'-',
			'ui',
		],
	},
	statusbars: {
		default: [] as {
			name: string;
			id: string;
			type: string;
			size: 'verySmall' | 'small' | 'medium' | 'large' | 'veryLarge';
			black: boolean;
			props: Record<string, any>;
		}[],
	},
	serverDisconnectedBehavior: {
		default: 'quiet' as 'quiet' | 'reload' | 'dialog',
	},
	nsfw: {
		default: 'respect' as 'respect' | 'force' | 'ignore',
	},
	highlightSensitiveMedia: {
		default: false,
	},
	animation: {
		default: !window.matchMedia('(prefers-reduced-motion)').matches,
	},
	animatedMfm: {
		default: !window.matchMedia('(prefers-reduced-motion)').matches,
	},
	advancedMfm: {
		default: true,
	},
	showReactionsCount: {
		default: false,
	},
	enableQuickAddMfmFunction: {
		default: false,
	},
	loadRawImages: {
		default: false,
	},
	imageNewTab: {
		default: false,
	},
	disableShowingAnimatedImages: {
		default: window.matchMedia('(prefers-reduced-motion)').matches,
	},
	emojiStyle: {
		default: 'twemoji', // twemoji / fluentEmoji / native
	},
	menuStyle: {
		default: 'auto' as 'auto' | 'popup' | 'drawer',
	},
	useBlurEffectForModal: {
		default: DEFAULT_DEVICE_KIND === 'desktop',
	},
	useBlurEffect: {
		default: DEFAULT_DEVICE_KIND === 'desktop',
	},
	showFixedPostForm: {
		default: false,
	},
	showFixedPostFormInChannel: {
		default: false,
	},
	enableInfiniteScroll: {
		default: true,
	},
	useReactionPickerForContextMenu: {
		default: false,
	},
	showGapBetweenNotesInTimeline: {
		default: false,
	},
	instanceTicker: {
		default: 'remote' as 'none' | 'remote' | 'always',
	},
	emojiPickerScale: {
		default: 1,
	},
	emojiPickerWidth: {
		default: 1,
	},
	emojiPickerHeight: {
		default: 2,
	},
	emojiPickerStyle: {
		default: 'auto' as 'auto' | 'popup' | 'drawer',
	},
	squareAvatars: {
		default: false,
	},
	showAvatarDecorations: {
		default: true,
	},
	numberOfPageCache: {
		default: 3,
	},
	showNoteActionsOnlyHover: {
		default: false,
	},
	showClipButtonInNoteFooter: {
		default: false,
	},
	reactionsDisplaySize: {
		default: 'medium' as 'small' | 'medium' | 'large',
	},
	limitWidthOfReaction: {
		default: true,
	},
	forceShowAds: {
		default: false,
	},
	aiChanMode: {
		default: false,
	},
	devMode: {
		default: false,
	},
	mediaListWithOneImageAppearance: {
		default: 'expand' as 'expand' | '16_9' | '1_1' | '2_3',
	},
	notificationPosition: {
		default: 'rightBottom' as 'leftTop' | 'leftBottom' | 'rightTop' | 'rightBottom',
	},
	notificationStackAxis: {
		default: 'horizontal' as 'vertical' | 'horizontal',
	},
	enableCondensedLine: {
		default: true,
	},
	keepScreenOn: {
		default: false,
	},
	disableStreamingTimeline: {
		default: false,
	},
	useGroupedNotifications: {
		default: true,
	},
	dataSaver: {
		default: {
			media: false,
			avatar: false,
			urlPreview: false,
			code: false,
		} as Record<string, boolean>,
	},
	hemisphere: {
		default: hemisphere as 'N' | 'S',
	},
	enableSeasonalScreenEffect: {
		default: false,
	},
	enableHorizontalSwipe: {
		default: true,
	},
	useNativeUiForVideoAudioPlayer: {
		default: false,
	},
	keepOriginalFilename: {
		default: true,
	},
	alwaysConfirmFollow: {
		default: true,
	},
	confirmWhenRevealingSensitiveMedia: {
		default: false,
	},
	contextMenu: {
		default: 'app' as 'app' | 'appWithShift' | 'native',
	},
	skipNoteRender: {
		default: true,
	},
	showSoftWordMutedWord: {
		default: false,
	},
	confirmOnReact: {
		default: false,
	},
	'sound.masterVolume': {
		default: 0.3,
	},
	'sound.notUseSound': {
		default: false,
	},
	'sound.useSoundOnlyWhenActive': {
		default: false,
	},
	'sound.on.note': {
		default: { type: 'syuilo/n-aec', volume: 1 } as SoundStore,
	},
	'sound.on.noteMy': {
		default: { type: 'syuilo/n-cea-4va', volume: 1 } as SoundStore,
	},
	'sound.on.notification': {
		default: { type: 'syuilo/n-ea', volume: 1 } as SoundStore,
	},
	'sound.on.reaction': {
		default: { type: 'syuilo/bubble2', volume: 1 } as SoundStore,
	},
	'deck.alwaysShowMainColumn': {
		default: true,
	},
	'deck.navWindow': {
		default: true,
	},
	'deck.useSimpleUiForNonRootPages': {
		default: true,
	},
	'deck.columnAlign': {
		default: 'left' as 'left' | 'right' | 'center',
	},
	'game.dropAndFusion': {
		default: {
			bgmVolume: 0.25,
			sfxVolume: 1,
		},
	},
} satisfies Record<string, {
	default: any;
	accountDependent?: boolean;
}>;

type PREF = typeof PREF_DEF;
type ValueOf<K extends keyof PREF> = PREF[K]['default'];
type Account = string; // <host>/<userId>

type Cond = {
	server: string | null; // 将来のため
	account: Account | null;
	device: string | null; // 将来のため
};

type PreferencesProfile = {
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

class ProfileManager {
	private write: (profile: PreferencesProfile) => void;
	public profile: PreferencesProfile;
	public store: Store<{
		[K in keyof PREF]: ValueOf<K>;
	}>;

	constructor(profile: PreferencesProfile, write: ProfileManager['write']) {
		this.profile = profile;
		this.write = write;

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
		this.write(this.profile);
	}

	public getMatchedRecord<K extends keyof PREF>(key: K): [Cond, ValueOf<K>] {
		const records = this.profile.preferences[key];

		if ($i == null) records.find(([cond, v]) => cond.account == null)!;

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

	public updateProfile(profile: PreferencesProfile) {
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
				this.store.set(key, PREF_DEF[key].default);
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

const preferencesProfileId = miLocalStorage.getItem('preferencesProfileId');
const currentProfileRaw = preferencesProfileId ? miLocalStorage.getItem(`preferences:${preferencesProfileId}`) : null;
const currentProfile = currentProfileRaw ? ProfileManager.normalizeProfile(JSON.parse(currentProfileRaw)) : ProfileManager.newProfile();
if (currentProfileRaw == null) {
	miLocalStorage.setItem(`preferences:${currentProfile.id}`, JSON.stringify(currentProfile));
	miLocalStorage.setItem('preferencesProfileId', currentProfile.id);
}

export const profileManager = new ProfileManager(currentProfile, (p) => {
	miLocalStorage.setItem(`preferences:${p.id}`, JSON.stringify(p));
	miLocalStorage.setItem('latestPreferencesUpdate', `${TAB_ID}/${Date.now()}`);
});
export const prefer = profileManager.store;

export function exportCurrentProfile() {
	const p = profileManager.profile;
	const txtBlob = new Blob([JSON.stringify(p)], { type: 'text/plain' });
	const dummya = document.createElement('a');
	dummya.href = URL.createObjectURL(txtBlob);
	dummya.download = `${p.id}.misskeypreferences`;
	dummya.click();
}

export function importProfile() {
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.misskeypreferences';
	input.onchange = async () => {
		if (input.files == null || input.files.length === 0) return;

		const file = input.files[0];
		const txt = await file.text();
		const profile = JSON.parse(txt) as PreferencesProfile;

		miLocalStorage.setItem(`preferences:${profile.id}`, JSON.stringify(profile));
		miLocalStorage.setItem('preferencesProfileId', profile.id);
		location.reload();
	};

	input.click();
}

let latestSyncedAt = Date.now();

function syncBetweenTabs() {
	const latest = miLocalStorage.getItem('latestPreferencesUpdate');
	if (latest == null) return;

	const latestTab = latest.split('/')[0];
	const latestAt = parseInt(latest.split('/')[1]);

	if (latestTab === TAB_ID) return;
	if (latestAt <= latestSyncedAt) return;

	profileManager.updateProfile(ProfileManager.normalizeProfile(JSON.parse(miLocalStorage.getItem(`preferences:${preferencesProfileId}`)!)));

	latestSyncedAt = Date.now();

	if (_DEV_) console.log('prefer:synced');
}

window.setInterval(syncBetweenTabs, 5000);

document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible') {
		syncBetweenTabs();
	}
});

if (_DEV_) {
	(window as any).profileManager = profileManager;
	(window as any).prefer = prefer;
}
