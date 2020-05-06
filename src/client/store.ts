import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import * as nestedProperty from 'nested-property';
import { apiUrl } from './config';

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
	],
};

export const defaultDeviceSettings = {
	lang: null,
	loadRawImages: false,
	alwaysShowNsfw: false,
	useOsNativeEmojis: false,
	autoReload: false,
	accounts: [],
	recentEmojis: [],
	themes: [],
	darkTheme: '8c539dc1-0fab-4d47-9194-39c508e9bfe1',
	lightTheme: '4eea646f-7afa-4645-83e9-83af0333cd37',
	darkMode: false,
	syncDeviceDarkMode: true,
	animation: true,
	animatedMfm: true,
	imageNewTab: false,
	showFixedPostForm: false,
	disablePagesScript: true,
	sfxVolume: 0.3,
	sfxNote: 'syuilo/down',
	sfxNoteMy: 'syuilo/up',
	sfxNotification: 'syuilo/pope2',
	sfxChat: 'syuilo/pope1',
	sfxChatBg: 'syuilo/waon',
	sfxAntenna: 'syuilo/triple',
	userData: {},
};

function copy<T>(data: T): T {
	return JSON.parse(JSON.stringify(data));
}

export default () => new Vuex.Store({
	plugins: [createPersistedState({
		paths: ['i', 'device', 'deviceUser', 'settings', 'instance']
	})],

	state: {
		i: null,
		pendingApiRequestsCount: 0,
		spinner: null
	},

	getters: {
		isSignedIn: state => state.i != null,
	},

	mutations: {
		updateI(state, x) {
			state.i = x;
		},

		updateIKeyValue(state, x) {
			state.i[x.key] = x.value;
		},
	},

	actions: {
		async login(ctx, i) {
			ctx.commit('updateI', i);
			ctx.commit('settings/init', i.clientData);
			ctx.commit('deviceUser/init', ctx.state.device.userData[i.id] || {});
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
			for (const [key, value] of Object.entries(me)) {
				ctx.commit('updateIKeyValue', { key, value });
			}

			if (me.clientData) {
				ctx.commit('settings/init', me.clientData);
			}
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
