import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import * as nestedProperty from 'nested-property';

import MiOS from './mios';

const defaultSettings = {
	keepCw: false,
	showFullAcct: false,
	rememberNoteVisibility: false,
	defaultNoteVisibility: 'public',
	uploadFolder: null,
	pastedFileName: 'yyyy-MM-dd HH-mm-ss [{{number}}]',
	wallpaper: null,
	memo: null,
	reactions: ['👍', '❤️', '😆', '🤔', '😮', '🎉', '💢', '😥', '😇', '🍮'],
	widgets: []
};

const defaultDeviceSettings = {
	lang: null,
	loadRawImages: false,
	alwaysShowNsfw: false,
	useOsDefaultEmojis: false,
	accounts: [],
};

export default (os: MiOS) => new Vuex.Store({
	plugins: [createPersistedState({
		paths: ['i', 'device', 'settings']
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

		updateIKeyValue(state, x) {
			state.i[x.key] = x.value;
		},
	},

	actions: {
		login(ctx, i) {
			ctx.commit('updateI', i);
			ctx.dispatch('settings/merge', i.clientData);
			if (!ctx.state.device.accounts.some(x => x.id === i.id)) {
				ctx.commit('device/set', {
					key: 'accounts',
					value: ctx.state.device.accounts.concat([{ id: i.id, token: localStorage.getItem('i') }])
				});
			}
		},

		logout(ctx) {
			ctx.commit('updateI', null);
			localStorage.removeItem('i');
		},

		switchAccount(ctx, i) {
			ctx.commit('updateI', i);
			ctx.dispatch('settings/merge', i.clientData);
			localStorage.setItem('i', i.token);
		},

		mergeMe(ctx, me) {
			for (const [key, value] of Object.entries(me)) {
				ctx.commit('updateIKeyValue', { key, value });
			}

			if (me.clientData) {
				ctx.dispatch('settings/merge', me.clientData);
			}
		},
	},

	modules: {
		device: {
			namespaced: true,

			state: defaultDeviceSettings,

			mutations: {
				set(state, x: { key: string; value: any }) {
					state[x.key] = x.value;
				},

				setTl(state, x) {
					state.tl = {
						src: x.src,
						arg: x.arg
					};
				},

				setVisibility(state, visibility) {
					state.visibility = visibility;
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

				addWidget(state, widget) {
					state.settings.widgets.unshift(widget);
					os.store.dispatch('updateWidgets');
				},

				updateWidget(state, x) {
					const w = state.settings.widgets.find(w => w.id == x.id);
					if (w) {
						w.data = x.data;
						os.store.dispatch('updateWidgets');
					}
				},
			},

			actions: {
				merge(ctx, settings) {
					if (settings == null) return;
					for (const [key, value] of Object.entries(settings)) {
						ctx.commit('set', { key, value });
					}
				},

				set(ctx, x) {
					ctx.commit('set', x);

					if (ctx.rootGetters.isSignedIn) {
						os.api('i/update-client-setting', {
							name: x.key,
							value: x.value
						});
					}
				},

				updateWidgets(ctx) {
					const widgets = ctx.state.widgets;
					ctx.commit('set', {
						key: 'widgets',
						value: widgets
					});
					os.api('i/update-client-setting', {
						name: 'widgets',
						value: widgets
					});
				},
			}
		}
	}
});
