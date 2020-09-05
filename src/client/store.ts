import { reactive, watch } from 'vue';
import { createStore } from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import * as nestedProperty from 'nested-property';
import { faSatelliteDish, faTerminal, faHashtag, faBroadcastTower, faFireAlt, faSearch, faStar, faAt, faListUl, faUserClock, faUsers, faCloud, faGamepad, faFileAlt, faSatellite, faDoorClosed, faColumns } from '@fortawesome/free-solid-svg-icons';
import { faBell, faEnvelope, faComments } from '@fortawesome/free-regular-svg-icons';
import { AiScript, utils, values } from '@syuilo/aiscript';
import { apiUrl, deckmode } from './config';
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
		'deck',
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
	recentEmojis: [],
	themes: [],
	darkTheme: '8c539dc1-0fab-4d47-9194-39c508e9bfe1',
	lightTheme: '4eea646f-7afa-4645-83e9-83af0333cd37',
	darkMode: false,
	deckMode: false,
	syncDeviceDarkMode: true,
	animation: true,
	animatedMfm: true,
	imageNewTab: false,
	showFixedPostForm: false,
	disablePagesScript: true,
	enableInfiniteScroll: true,
	fixedWidgetsPosition: false,
	useBlurEffectForModal: true,
	sidebarDisplay: 'full', // full, icon, hide
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

export const store = createStore({
	plugins: [createPersistedState({
		paths: ['i', 'device', 'deviceUser', 'settings', 'instance']
	})],

	state: {
		i: null,
		pendingApiRequestsCount: 0,
		spinner: null,
		dialogs: [] as {
			id: any;
			type: 'info' | 'question' | 'warn' | 'success' | 'error';
			title: string;
			text: string;
			result: any;
		}[],
		postForm: null,
		fullView: false,

		// Plugin
		pluginContexts: new Map<string, AiScript>(),
		postFormActions: [],
		userActions: [],
		noteActions: [],
		noteViewInterruptors: [],
		notePostInterruptors: [],
	},

	getters: {
		isSignedIn: state => state.i != null,

		nav: (state, getters) => actions => ({
			notifications: {
				title: 'notifications',
				icon: faBell,
				get show() { return getters.isSignedIn; },
				get indicated() { return getters.isSignedIn && state.i.hasUnreadNotification; },
				to: '/my/notifications',
			},
			messaging: {
				title: 'messaging',
				icon: faComments,
				get show() { return getters.isSignedIn; },
				get indicated() { return getters.isSignedIn && state.i.hasUnreadMessagingMessage; },
				to: '/my/messaging',
			},
			drive: {
				title: 'drive',
				icon: faCloud,
				get show() { return getters.isSignedIn; },
				to: '/my/drive',
			},
			followRequests: {
				title: 'followRequests',
				icon: faUserClock,
				get show() { return getters.isSignedIn && state.i.isLocked; },
				get indicated() { return getters.isSignedIn && state.i.hasPendingReceivedFollowRequest; },
				to: '/my/follow-requests',
			},
			featured: {
				title: 'featured',
				icon: faFireAlt,
				to: '/featured',
			},
			explore: {
				title: 'explore',
				icon: faHashtag,
				to: '/explore',
			},
			announcements: {
				title: 'announcements',
				icon: faBroadcastTower,
				get indicated() { return getters.isSignedIn && state.i.hasUnreadAnnouncement; },
				to: '/announcements',
			},
			search: {
				title: 'search',
				icon: faSearch,
				action: () => actions.search(),
			},
			lists: {
				title: 'lists',
				icon: faListUl,
				get show() { return getters.isSignedIn; },
				to: '/my/lists',
			},
			groups: {
				title: 'groups',
				icon: faUsers,
				get show() { return getters.isSignedIn; },
				to: '/my/groups',
			},
			antennas: {
				title: 'antennas',
				icon: faSatellite,
				get show() { return getters.isSignedIn; },
				to: '/my/antennas',
			},
			mentions: {
				title: 'mentions',
				icon: faAt,
				get show() { return getters.isSignedIn; },
				get indicated() { return getters.isSignedIn && state.i.hasUnreadMentions; },
				to: '/my/mentions',
			},
			messages: {
				title: 'directNotes',
				icon: faEnvelope,
				get show() { return getters.isSignedIn; },
				get indicated() { return getters.isSignedIn && state.i.hasUnreadSpecifiedNotes; },
				to: '/my/messages',
			},
			favorites: {
				title: 'favorites',
				icon: faStar,
				get show() { return getters.isSignedIn; },
				to: '/my/favorites',
			},
			pages: {
				title: 'pages',
				icon: faFileAlt,
				get show() { return getters.isSignedIn; },
				to: '/my/pages',
			},
			channels: {
				title: 'channel',
				icon: faSatelliteDish,
				to: '/channels',
			},
			games: {
				title: 'games',
				icon: faGamepad,
				to: '/games',
			},
			scratchpad: {
				title: 'scratchpad',
				icon: faTerminal,
				to: '/scratchpad',
			},
			rooms: {
				title: 'rooms',
				icon: faDoorClosed,
				get show() { return getters.isSignedIn; },
				get to() { return `/@${state.i.username}/room`; },
			},
			deck: {
				title: deckmode ? 'undeck' : 'deck',
				icon: faColumns,
				action: () => {
					localStorage.setItem('deckmode', (!deckmode).toString());
					location.reload();
				},
			},
		}),
	},

	mutations: {
		updateI(state, x) {
			state.i = x;
		},

		updateIKeyValue(state, { key, value }) {
			state.i[key] = value;
		},

		addDialog(state, dialog) {
			state.dialogs.push(dialog);
		},

		dialogDone(state, { id: dialogId, result }) {
			const dialog = state.dialogs.find(d => d.id === dialogId);
			dialog.result = result;
		},

		removeDialog(state, dialogId) {
			state.dialogs = state.dialogs.filter(d => d.id !== dialogId);
		},

		setPostForm(state, postForm) {
			if (state.postForm != null && postForm != null) return;
			state.postForm = postForm;
		},

		setFullView(state, v) {
			state.fullView = v;
		},

		initPlugin(state, { plugin, aiscript }) {
			state.pluginContexts.set(plugin.id, aiscript);
		},

		registerPostFormAction(state, { pluginId, title, handler }) {
			state.postFormActions.push({
				title, handler: (form, update) => {
					state.pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(form), values.FN_NATIVE(([key, value]) => {
						update(key.value, value.value);
					})]);
				}
			});
		},

		registerUserAction(state, { pluginId, title, handler }) {
			state.userActions.push({
				title, handler: (user) => {
					state.pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(user)]);
				}
			});
		},

		registerNoteAction(state, { pluginId, title, handler }) {
			state.noteActions.push({
				title, handler: (note) => {
					state.pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]);
				}
			});
		},

		registerNoteViewInterruptor(state, { pluginId, handler }) {
			state.noteViewInterruptors.push({
				handler: (note) => {
					return state.pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]);
				}
			});
		},

		registerNotePostInterruptor(state, { pluginId, handler }) {
			state.notePostInterruptors.push({
				handler: (note) => {
					return state.pluginContexts.get(pluginId).execFn(handler, [utils.jsToVal(note)]);
				}
			});
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

		showDialog(ctx, opts) {
			return new Promise((res, rej) => {
				const dialog = reactive({
					...opts,
					result: null,
					id: Math.random().toString() // TODO: uuidとか使う
				});
				ctx.commit('addDialog', dialog);
				const unwatch = watch(() => dialog.result, result => {
					unwatch();
					res(result);
				});
			});
		},

		api(ctx, { endpoint, data, token }) {
			if (++ctx.state.pendingApiRequestsCount === 1) {
				// TODO: spinnerの表示はstoreでやらない
				ctx.state.spinner = document.createElement('div');
				ctx.state.spinner.setAttribute('id', 'wait');
				document.body.appendChild(ctx.state.spinner);
			}

			const onFinally = () => {
				if (--ctx.state.pendingApiRequestsCount === 0) ctx.state.spinner.parentNode.removeChild(ctx.state.spinner);
			};

			const promise = new Promise((resolve, reject) => {
				// Append a credential
				if (ctx.getters.isSignedIn) (data as any).i = ctx.state.i.token;
				if (token !== undefined) (data as any).i = token;

				// Send request
				fetch(endpoint.indexOf('://') > -1 ? endpoint : `${apiUrl}/${endpoint}`, {
					method: 'POST',
					body: JSON.stringify(data),
					credentials: 'omit',
					cache: 'no-cache'
				}).then(async (res) => {
					const body = res.status === 204 ? null : await res.json();

					if (res.status === 200) {
						resolve(body);
					} else if (res.status === 204) {
						resolve();
					} else {
						reject(body.error);
					}
				}).catch(reject);
			});

			promise.then(onFinally, onFinally);

			return promise;
		}
	},

	modules: {
		instance: {
			namespaced: true,

			state: {
				meta: null
			},

			mutations: {
				set(state, meta) {
					state.meta = meta;
				},
			},

			actions: {
				async fetch(ctx) {
					const meta = await ctx.dispatch('api', {
						endpoint: 'meta',
						data: {
							detail: false
						}
					}, { root: true });

					ctx.commit('set', meta);
				}
			}
		},

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
						ctx.dispatch('api', {
							endpoint: 'i/update-client-setting',
							data: {
								name: x.key,
								value: x.value
							}
						}, { root: true });
					}
				},
			}
		}
	}
});
