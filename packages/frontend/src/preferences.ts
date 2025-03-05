/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { computed, onUnmounted, ref, watch } from 'vue';
import { v4 as uuid } from 'uuid';
import * as Misskey from 'misskey-js';
import { version } from '@@/js/config.js';
import type { Ref, WritableComputedRef } from 'vue';
import type { Theme } from '@/scripts/theme.js';
import type { SoundType } from '@/scripts/sound.js';
import { miLocalStorage } from '@/local-storage.js';
import { DEFAULT_DEVICE_KIND } from '@/scripts/device-kind.js';

//type DottedToNested<T extends Record<string, any>> = {
//	[K in keyof T as K extends string ? K extends `${infer A}.${infer B}` ? A : K : K]: K extends `${infer A}.${infer B}` ? DottedToNested<{ [key in B]: T[K] }> : T[K];
//};

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
		where: 'deviceAccount',
		default: 'left' as 'left' | 'right' | 'center',
	},
};

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
};

function newProfile(): PreferencesProfile {
	return {
		id: uuid(),
		version: version,
		type: 'main',
		modifiedAt: Date.now(),
		name: '',
		preferences: {},
	};
}

const preferencesProfileId = miLocalStorage.getItem('preferencesProfileId');
const currentProfileRaw = preferencesProfileId ? miLocalStorage.getItem(`preferences:${preferencesProfileId}`) : null;
const currentProfile = currentProfileRaw ? JSON.parse(currentProfileRaw) as PreferencesProfile : newProfile();
if (currentProfileRaw == null) {
	miLocalStorage.setItem(`preferences:${currentProfile.id}`, JSON.stringify(currentProfile));
	miLocalStorage.setItem('preferencesProfileId', currentProfile.id);
}

// TODO: タブ間で同期

class Preferences {
	public save: (preferences: { [K in keyof PREF]: ValueOf<K> }) => void;

	/**
	 * static の略 (static が予約語のため)
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

	constructor(preferences: { [K in keyof PREF]?: ValueOf<K> }, save: Preferences['save']) {
		this.save = save;

		for (const key in PREF_DEF) {
			this.s[key] = preferences[key] ?? PREF_DEF[key]['default'];
			this.r[key] = ref(this.s[key]);
		}
	}

	public set<K extends keyof PREF>(key: K, value: ValueOf<K>) {
		this.r[key].value = this.s[key] = value;

		this.save(this.s);
	}

	/**
	 * 特定のキーの、簡易的なcomputed refを作ります
	 * 主にvue上で設定コントロールのmodelとして使う用
	 */
	public model<K extends keyof PREF, V = ValueOf<K>>(
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
				this.set(key, val);
				valueRef.value = val;
			},
		});
	}
}

export const prefer = new Preferences(currentProfile.preferences, (preferences) => {
	currentProfile.preferences = preferences;
	currentProfile.modifiedAt = Date.now();
	miLocalStorage.setItem(`preferences:${currentProfile.id}`, JSON.stringify(currentProfile));
});
