/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, onUnmounted, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import * as Misskey from 'misskey-js';
import { host, version } from '@@/js/config.js';
import { $i } from './account.js';
import type { Ref, WritableComputedRef } from 'vue';
import type { Theme } from '@/scripts/theme.js';
import type { SoundType } from '@/scripts/sound.js';
import { miLocalStorage } from '@/local-storage.js';
import { DEFAULT_DEVICE_KIND } from '@/scripts/device-kind.js';

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

class Preferences<Data extends Record<string, any>> {
	public save: <K extends keyof Data>(key: K, value: Data[K]) => void;

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

	constructor(data: { [K in keyof Data]: Data[K] }, save: Preferences<Data>['save']) {
		this.save = save;

		for (const key in data) {
			this.s[key] = data[key];
			this.r[key] = ref(this.s[key]);
		}
	}

	public set<K extends keyof Data>(key: K, value: Data[K]) {
		this.r[key].value = this.s[key] = value;

		this.save(key, value);
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
} satisfies Record<string, { default: any, accountDependent?: boolean }>;

type PREF = typeof PREF_DEF;
type ValueOf<K extends keyof PREF> = PREF[K]['default'];

type PreferencesProfile = {
	id: string;
	version: string;
	type: 'main';
	modifiedAt: number;
	name: string;
	preferences: {
		[K in keyof PREF]?: ValueOf<K>;
	};
	// 将来的にマルチサーバー対応した場合のため
	serverOverrides: Record<string, { // key is <host>
		[K in keyof PREF]?: ValueOf<K>;
	}>;
	accountOverrides: Record<string, { // key is <host>/<userId>
		[K in keyof PREF]?: ValueOf<K>;
	}>;
};

// TODO: タブ間で同期

class ProfileManager {
	private write: (profile: PreferencesProfile) => void;
	public profile: PreferencesProfile;
	public prefer: Preferences<{
		[K in keyof PREF]: ValueOf<K>;
	}>;

	constructor(profile: PreferencesProfile, write: ProfileManager['write']) {
		this.profile = profile;
		this.write = write;

		const data = {} as { [K in keyof PREF]: ValueOf<K> };
		for (const key in PREF_DEF) {
			// NOTE: 明示的な設定値のひとつとして null もあり得るため、設定が存在しないかどうかを判定する目的で null で比較したり ?? を使ってはいけない

			const hasAccountOverride = $i != null && this.profile.accountOverrides[`${host}/${$i.id}`] != null && this.profile.accountOverrides[`${host}/${$i.id}`][key] !== undefined;

			data[key] = hasAccountOverride
				? this.profile.accountOverrides[`${host}/${$i!.id}`][key]
				: this.profile.preferences[key] !== undefined
					? this.profile.preferences[key]
					: PREF_DEF[key].default;
		}

		this.prefer = new Preferences(data, (key, v) => {
			console.log('set', key, v);

			const hasAccountOverride = $i != null && this.profile.accountOverrides[`${host}/${$i.id}`] != null && this.profile.accountOverrides[`${host}/${$i.id}`][key] !== undefined;

			if (hasAccountOverride) {
				this.profile.accountOverrides[`${host}/${$i!.id}`][key] = v;
			} else if ($i != null && PREF_DEF[key].accountDependent) {
				if (this.profile.accountOverrides[`${host}/${$i.id}`] == null) {
					this.profile.accountOverrides[`${host}/${$i.id}`] = {};
				}
				this.profile.accountOverrides[`${host}/${$i.id}`][key] = v;
			} else {
				this.profile.preferences[key] = v;
			}
			this.save();
		});
	}

	public static newProfile(): PreferencesProfile {
		return {
			id: uuid(),
			version: version,
			type: 'main',
			modifiedAt: Date.now(),
			name: '',
			preferences: {},
			serverOverrides: {},
			accountOverrides: {},
		};
	}

	public save() {
		this.profile.modifiedAt = Date.now();
		this.profile.version = version;
		this.write(this.profile);
	}

	public setAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PREF_DEF[key].accountDependent) throw new Error('already account-dependent');

		if (this.profile.accountOverrides[`${host}/${$i.id}`] == null) {
			this.profile.accountOverrides[`${host}/${$i.id}`] = {};
		}

		this.profile.accountOverrides[`${host}/${$i.id}`][key] = this.profile.preferences[key] !== undefined ? this.profile.preferences[key] : PREF_DEF[key].default;
		this.save();
	}

	public clearAccountOverride<K extends keyof PREF>(key: K) {
		if ($i == null) return;
		if (PREF_DEF[key].accountDependent) throw new Error('cannot clear override for this account-dependent property');

		if (this.profile.accountOverrides[`${host}/${$i.id}`] != null) {
			delete this.profile.accountOverrides[`${host}/${$i.id}`][key];
		}

		this.save();
	}
}

const preferencesProfileId = miLocalStorage.getItem('preferencesProfileId');
const currentProfileRaw = preferencesProfileId ? miLocalStorage.getItem(`preferences:${preferencesProfileId}`) : null;
const currentProfile = currentProfileRaw ? JSON.parse(currentProfileRaw) as PreferencesProfile : ProfileManager.newProfile();
if (currentProfileRaw == null) {
	miLocalStorage.setItem(`preferences:${currentProfile.id}`, JSON.stringify(currentProfile));
	miLocalStorage.setItem('preferencesProfileId', currentProfile.id);
}

export const profileManager = new ProfileManager(currentProfile, (p) => {
	miLocalStorage.setItem(`preferences:${p.id}`, JSON.stringify(p));
});
export const prefer = profileManager.prefer;

if (_DEV_) {
	(window as any).profileManager = profileManager;
	(window as any).prefer = prefer;
}
