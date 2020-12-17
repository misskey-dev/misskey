import { markRaw } from 'vue';
import { Storage } from './pizzax';

export const defaultDeviceSettings = {
	lang: null,
	roomGraphicsQuality: 'medium',
	roomUseOrthographicCamera: true,
};

export const postFormActions = [];
export const userActions = [];
export const noteActions = [];
export const noteViewInterruptors = [];
export const notePostInterruptors = [];

// TODO: それぞれいちいちwhereとかdefaultというキーを付けなきゃいけないの冗長なのでなんとかする(ただ型定義が面倒になりそう)
export const defaultStore = markRaw(new Storage('base', {
	tutorial: {
		where: 'account',
		default: 0
	},
	keepCw: {
		where: 'account',
		default: false
	},
	showFullAcct: {
		where: 'account',
		default: false
	},
	rememberNoteVisibility: {
		where: 'account',
		default: false
	},
	defaultNoteVisibility: {
		where: 'account',
		default: 'public'
	},
	defaultNoteLocalOnly: {
		where: 'account',
		default: false
	},
	uploadFolder: {
		where: 'account',
		default: null
	},
	pastedFileName: {
		where: 'account',
		default: 'yyyy-MM-dd HH-mm-ss [{{number}}]'
	},
	memo: {
		where: 'account',
		default: null
	},
	reactions: {
		where: 'account',
		default: ['👍', '❤️', '😆', '🤔', '😮', '🎉', '💢', '😥', '😇', '🍮']
	},
	mutedWords: {
		where: 'account',
		default: []
	},

	menu: {
		where: 'deviceAccount',
		default: [
			'notifications',
			'messaging',
			'drive',
			'-',
			'followRequests',
			'featured',
			'explore',
			'announcements',
			'search',
			'-',
			'ui',
		]
	},
	visibility: {
		where: 'deviceAccount',
		default: 'public' as 'public' | 'home' | 'followers' | 'specified'
	},
	localOnly: {
		where: 'deviceAccount',
		default: false
	},
	widgets: {
		where: 'deviceAccount',
		default: [] as {
			name: string;
			id: string;
			data: Record<string, any>;
		}[]
	},
	tl: {
		where: 'deviceAccount',
		default: {
			src: 'home',
			arg: null
		}
	},

	serverDisconnectedBehavior: {
		where: 'device',
		default: 'quiet' as 'quiet' | 'reload' | 'dialog'
	},
	nsfw: {
		where: 'device',
		default: 'respect' as 'respect' | 'force' | 'ignore'
	},
	animation: {
		where: 'device',
		default: true
	},
	animatedMfm: {
		where: 'device',
		default: true
	},
	loadRawImages: {
		where: 'device',
		default: false
	},
	imageNewTab: {
		where: 'device',
		default: false
	},
	disableShowingAnimatedImages: {
		where: 'device',
		default: false
	},
	disablePagesScript: {
		where: 'device',
		default: false
	},
	useOsNativeEmojis: {
		where: 'device',
		default: false
	},
	useBlurEffectForModal: {
		where: 'device',
		default: true
	},
	showFixedPostForm: {
		where: 'device',
		default: false
	},
	enableInfiniteScroll: {
		where: 'device',
		default: true
	},
	showGapBetweenNotesInTimeline: {
		where: 'device',
		default: true
	},
	darkMode: {
		where: 'device',
		default: false
	},
	instanceTicker: {
		where: 'device',
		default: 'remote' as 'none' | 'remote' | 'always'
	},
	reactionPickerWidth: {
		where: 'device',
		default: 1
	},
	reactionPickerHeight: {
		where: 'device',
		default: 1
	},
	recentlyUsedEmojis: {
		where: 'device',
		default: [] as string[]
	},
	recentlyUsedUsers: {
		where: 'device',
		default: [] as string[]
	},
	defaultSideView: {
		where: 'device',
		default: false
	},
	sidebarDisplay: {
		where: 'device',
		default: 'full' as 'full' | 'icon'
	},
}));

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$pizzax: typeof defaultStore;
	}
}
