import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import * as nestedProperty from 'nested-property';
import { api } from '@/os';
import { erase } from '../prelude/array';

export const defaultSettings = {
	tutorial: 0,
	keepCw: false,
	showFullAcct: false,
	rememberNoteVisibility: false,
	defaultNoteVisibility: 'public',
	defaultNoteLocalOnly: false,
	uploadFolder: null,
	pastedFileName: 'yyyy-MM-dd HH-mm-ss [{{number}}]',
	memo: null,
	reactions: ['👍', '❤️', '😆', '🤔', '😮', '🎉', '💢', '😥', '😇', '🍮'],
	mutedWords: [],
};

export const defaultDeviceUserSettings = {
	visibility: 'public',
	localOnly: false,
	widgets: [],
	tl: {
		src: 'home'
	},
	menu: [
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
	],
	plugins: [] as {
		id: string;
		name: string;
		active: boolean;
		configData: Record<string, any>;
		token: string;
		ast: any[];
	}[],
};

export const defaultDeviceSettings = {
	lang: null,
	serverDisconnectedBehavior: 'quiet',
	recentlyUsedEmojis: [],
	recentlyUsedUsers: [],
	deckMode: false,
	chatOpenBehavior: 'page',
	defaultSideView: false,
	deckNavWindow: true,
	showFixedPostForm: false,
	disablePagesScript: false,
	enableInfiniteScroll: true,
	useBlurEffectForModal: true,
	useFullReactionPicker: false,
	reactionPickerWidth: 1,
	reactionPickerHeight: 1,
	sidebarDisplay: 'full', // full, icon, hide
	instanceTicker: 'remote', // none, remote, always
	roomGraphicsQuality: 'medium',
	roomUseOrthographicCamera: true,
	deckColumnAlign: 'left',
	deckAlwaysShowMainColumn: true,
	deckMainColumnPlace: 'left',
};

function copy<T>(data: T): T {
	return JSON.parse(JSON.stringify(data));
}

export const postFormActions = [];
export const userActions = [];
export const noteActions = [];
export const noteViewInterruptors = [];
export const notePostInterruptors = [];

export const store = createStore({
	strict: _DEV_,

	plugins: [createPersistedState({
		paths: ['i', 'device', 'deviceUser', 'settings', 'instance']
	})],

	state: {
		i: null,
	},

	getters: {
		isSignedIn: state => state.i != null,
	},

	mutations: {
		updateI(state, x) {
			state.i = x;
		},

		updateIKeyValue(state, { key, value }) {
			state.i[key] = value;
		},
	},

	actions: {
		async login(ctx, i) {
			ctx.commit('updateI', i);
			ctx.commit('settings/init', i.clientData);
			ctx.commit('deviceUser/init', ctx.state.device.userData[i.id] || {});
			// TODO: ローカルストレージを消してページリロードしたときは i が無いのでその場合のハンドリングをよしなにやる
			await ctx.dispatch('addAcount', { id: i.id, i: localStorage.getItem('i') });
		},

		addAcount(ctx, info) {
			if (!ctx.state.device.accounts.some(x => x.id === info.id)) {
				ctx.commit('device/set', {
					key: 'accounts',
					value: ctx.state.device.accounts.concat([{ id: info.id, token: info.i }])
				});
			}
		},

		logout(ctx) {
			ctx.commit('device/setUserData', { userId: ctx.state.i.id, data: ctx.state.deviceUser });
			ctx.commit('updateI', null);
			ctx.commit('settings/init', {});
			ctx.commit('deviceUser/init', {});
			localStorage.removeItem('i');
			document.cookie = `igi=; path=/`;
		},

		async switchAccount(ctx, i) {
			ctx.commit('device/setUserData', { userId: ctx.state.i.id, data: ctx.state.deviceUser });
			localStorage.setItem('i', i.token);
			await ctx.dispatch('login', i);
		},

		mergeMe(ctx, me) {
			// TODO: プロパティ一つ一つに対してコミットが発生するのはアレなので良い感じにする
			for (const [key, value] of Object.entries(me)) {
				ctx.commit('updateIKeyValue', { key, value });
			}

			if (me.clientData) {
				ctx.commit('settings/init', me.clientData);
			}
		},
	},

	modules: {
		instance: {
			namespaced: true,

			state: {
				meta: null
			},

			getters: {
				emojiCategories: state => {
					const categories = new Set();
					for (const emoji of state.meta.emojis) {
						categories.add(emoji.category);
					}
					return Array.from(categories);
				},
			},

			mutations: {
				set(state, meta) {
					state.meta = meta;
				},
			},

			actions: {
				async fetch(ctx) {
					const meta = await api('meta', {
						detail: false
					});

					ctx.commit('set', meta);
				}
			}
		},

		device: {
			namespaced: true,

			state: defaultDeviceSettings,

			mutations: {
				overwrite(state, x) {
					for (const k of Object.keys(state)) {
						if (x[k] === undefined) delete state[k];
					}
					for (const k of Object.keys(x)) {
						state[k] = x[k];
					}
				},

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
				overwrite(state, x) {
					for (const k of Object.keys(state)) {
						if (x[k] === undefined) delete state[k];
					}
					for (const k of Object.keys(x)) {
						state[k] = x[k];
					}
				},

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

				setMenu(state, menu) {
					state.menu = menu;
				},

				setVisibility(state, visibility) {
					state.visibility = visibility;
				},

				setLocalOnly(state, localOnly) {
					state.localOnly = localOnly;
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

				installPlugin(state, { id, meta, ast, token }) {
					state.plugins.push({
						...meta,
						id,
						active: true,
						configData: {},
						token: token,
						ast: ast
					});
				},

				uninstallPlugin(state, id) {
					state.plugins = state.plugins.filter(x => x.id != id);
				},

				configPlugin(state, { id, config }) {
					state.plugins.find(p => p.id === id).configData = config;
				},

				changePluginActive(state, { id, active }) {
					state.plugins.find(p => p.id === id).active = active;
				},
			}
		},

		settings: {
			namespaced: true,

			state: defaultSettings,

			mutations: {
				set(state, x: { key: string; value: any }) {
					nestedProperty.set(state, x.key, x.value);
				},

				init(state, x) {
					for (const [key, value] of Object.entries(defaultSettings)) {
						if (Object.prototype.hasOwnProperty.call(x, key)) {
							state[key] = x[key];
						} else {
							state[key] = value;
						}
					}
				},
			},

			actions: {
				set(ctx, x) {
					ctx.commit('set', x);

					if (ctx.rootGetters.isSignedIn) {
						api('i/update-client-setting', {
							name: x.key,
							value: x.value
						});
					}
				},
			}
		}
	}
});

// このファイルに書きたくないけどここに書かないと何故かVeturが認識しない
declare module '@vue/runtime-core' {
	interface ComponentCustomProperties {
		$store: typeof store;
	}
}
