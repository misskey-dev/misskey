import { markRaw } from 'vue';
import { Storage } from './pizzax';

export const defaultDeviceUserSettings = {
	widgets: [],
	tl: {
		src: 'home'
	},
};

export const defaultDeviceSettings = {
	lang: null,
	sidebarDisplay: 'full', // full, icon, hide
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


createStore({
	strict: _DEV_,

	plugins: [createPersistedState({
		paths: ['device', 'deviceUser', 'instance']
	})],

	modules: {
		device: {
			namespaced: true,

			state: defaultDeviceSettings,

			mutations: {
				set(state, x: { key: string; value: any }) {
					state[x.key] = x.value;
				},

				setUserData(state, x: { userId: string; data: any }) {
					state.userData[x.userId] = copy(x.data);
				},
			}
		},

		deviceUser: {
			namespaced: true,

			state: defaultDeviceUserSettings,

			mutations: {
				init(state, x) {
					for (const [key, value] of Object.entries(defaultDeviceUserSettings)) {
						if (Object.prototype.hasOwnProperty.call(x, key)) {
							state[key] = x[key];
						} else {
							state[key] = value;
						}
					}
				},

				set(state, x: { key: string; value: any }) {
					state[x.key] = x.value;
				},

				setTl(state, x) {
					state.tl = {
						src: x.src,
						arg: x.arg
					};
				},

				setWidgets(state, widgets) {
					state.widgets = widgets;
				},

				addWidget(state, widget) {
					state.widgets.unshift(widget);
				},

				removeWidget(state, widget) {
					state.widgets = state.widgets.filter(w => w.id != widget.id);
				},

				updateWidget(state, x) {
					const w = state.widgets.find(w => w.id === x.id);
					if (w) {
						w.data = x.data;
					}
				},
			}
		},
	}
});
