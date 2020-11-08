import { createStore } from 'vuex';
import * as nestedProperty from 'nested-property';
import { api } from '@/os';
import { erase } from '../prelude/array';
import { VuexPersistDB } from './scripts/vuex-idb';
import { vuexPersistAndSharePlugin } from './scripts/vuex-persist-and-share';

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
	deck: {
		columns: [],
		layout: [],
	},
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
	loadRawImages: false,
	alwaysShowNsfw: false,
	useOsNativeEmojis: false,
	serverDisconnectedBehavior: 'quiet',
	accounts: [],
	recentlyUsedEmojis: [],
	recentlyUsedUsers: [],
	themes: [],
	darkTheme: '8050783a-7f63-445a-b270-36d0f6ba1677',
	lightTheme: '4eea646f-7afa-4645-83e9-83af0333cd37',
	darkMode: false,
	deckMode: false,
	syncDeviceDarkMode: true,
	animation: true,
	animatedMfm: true,
	imageNewTab: false,
	chatOpenBehavior: 'page',
	defaultSideView: false,
	deckNavWindow: true,
	showFixedPostForm: false,
	disablePagesScript: false,
	enableInfiniteScroll: true,
	useBlurEffectForModal: true,
	useFullReactionPicker: false,
	sidebarDisplay: 'full', // full, icon, hide
	instanceTicker: 'remote', // none, remote, always
	roomGraphicsQuality: 'medium',
	roomUseOrthographicCamera: true,
	deckColumnAlign: 'left',
	deckAlwaysShowMainColumn: true,
	deckMainColumnPlace: 'left',
	sfxVolume: 0.3,
	sfxNote: 'syuilo/down',
	sfxNoteMy: 'syuilo/up',
	sfxNotification: 'syuilo/pope2',
	sfxChat: 'syuilo/pope1',
	sfxChatBg: 'syuilo/waon',
	sfxAntenna: 'syuilo/triple',
	sfxChannel: 'syuilo/square-pico',
	userData: {},
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

	plugins: [
		// Increment dbVersion after changing modules
		vuexPersistAndSharePlugin(['i'], ['device', 'deviceUser', 'settings', 'instance'], 2)
	],

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
			const db = new VuexPersistDB();
			ctx.dispatch('addAcount', { id: i.id, i: await db.get('i', 'store') });
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
						if (x[key]) {
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

				//#region Deck
				addDeckColumn(state, column) {
					if (column.name == undefined) column.name = null;
					state.deck.columns.push(column);
					state.deck.layout.push([column.id]);
				},

				removeDeckColumn(state, id) {
					state.deck.columns = state.deck.columns.filter(c => c.id != id);
					state.deck.layout = state.deck.layout.map(ids => erase(id, ids));
					state.deck.layout = state.deck.layout.filter(ids => ids.length > 0);
				},

				swapDeckColumn(state, x) {
					const a = x.a;
					const b = x.b;
					const aX = state.deck.layout.findIndex(ids => ids.indexOf(a) != -1);
					const aY = state.deck.layout[aX].findIndex(id => id == a);
					const bX = state.deck.layout.findIndex(ids => ids.indexOf(b) != -1);
					const bY = state.deck.layout[bX].findIndex(id => id == b);
					state.deck.layout[aX][aY] = b;
					state.deck.layout[bX][bY] = a;
				},

				swapLeftDeckColumn(state, id) {
					state.deck.layout.some((ids, i) => {
						if (ids.indexOf(id) != -1) {
							const left = state.deck.layout[i - 1];
							if (left) {
								// https://vuejs.org/v2/guide/list.html#Caveats
								//state.deck.layout[i - 1] = state.deck.layout[i];
								//state.deck.layout[i] = left;
								state.deck.layout.splice(i - 1, 1, state.deck.layout[i]);
								state.deck.layout.splice(i, 1, left);
							}
							return true;
						}
					});
				},

				swapRightDeckColumn(state, id) {
					state.deck.layout.some((ids, i) => {
						if (ids.indexOf(id) != -1) {
							const right = state.deck.layout[i + 1];
							if (right) {
								// https://vuejs.org/v2/guide/list.html#Caveats
								//state.deck.layout[i + 1] = state.deck.layout[i];
								//state.deck.layout[i] = right;
								state.deck.layout.splice(i + 1, 1, state.deck.layout[i]);
								state.deck.layout.splice(i, 1, right);
							}
							return true;
						}
					});
				},

				swapUpDeckColumn(state, id) {
					const ids = state.deck.layout.find(ids => ids.indexOf(id) != -1);
					ids.some((x, i) => {
						if (x == id) {
							const up = ids[i - 1];
							if (up) {
								// https://vuejs.org/v2/guide/list.html#Caveats
								//ids[i - 1] = id;
								//ids[i] = up;
								ids.splice(i - 1, 1, id);
								ids.splice(i, 1, up);
							}
							return true;
						}
					});
				},

				swapDownDeckColumn(state, id) {
					const ids = state.deck.layout.find(ids => ids.indexOf(id) != -1);
					ids.some((x, i) => {
						if (x == id) {
							const down = ids[i + 1];
							if (down) {
								// https://vuejs.org/v2/guide/list.html#Caveats
								//ids[i + 1] = id;
								//ids[i] = down;
								ids.splice(i + 1, 1, id);
								ids.splice(i, 1, down);
							}
							return true;
						}
					});
				},

				stackLeftDeckColumn(state, id) {
					const i = state.deck.layout.findIndex(ids => ids.indexOf(id) != -1);
					state.deck.layout = state.deck.layout.map(ids => erase(id, ids));
					const left = state.deck.layout[i - 1];
					if (left) state.deck.layout[i - 1].push(id);
					state.deck.layout = state.deck.layout.filter(ids => ids.length > 0);
				},

				popRightDeckColumn(state, id) {
					const i = state.deck.layout.findIndex(ids => ids.indexOf(id) != -1);
					state.deck.layout = state.deck.layout.map(ids => erase(id, ids));
					state.deck.layout.splice(i + 1, 0, [id]);
					state.deck.layout = state.deck.layout.filter(ids => ids.length > 0);
				},

				addDeckWidget(state, x) {
					const column = state.deck.columns.find(c => c.id == x.id);
					if (column == null) return;
					if (column.widgets == null) column.widgets = [];
					column.widgets.unshift(x.widget);
				},

				removeDeckWidget(state, x) {
					const column = state.deck.columns.find(c => c.id == x.id);
					if (column == null) return;
					column.widgets = column.widgets.filter(w => w.id != x.widget.id);
				},

				renameDeckColumn(state, x) {
					const column = state.deck.columns.find(c => c.id == x.id);
					if (column == null) return;
					column.name = x.name;
				},

				updateDeckColumn(state, x) {
					let column = state.deck.columns.find(c => c.id == x.id);
					if (column == null) return;
					column = x;
				},
				//#endregion

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
						if (x[key]) {
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
