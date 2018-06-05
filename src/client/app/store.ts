import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import MiOS from './mios';
import { hostname } from './config';

const defaultSettings = {
	home: [],
	mobileHome: [],
	deck: {
		columns: [/*{
			type: 'widgets',
			widgets: []
		}, */{
			type: 'home'
		}, {
			type: 'notifications'
		}, {
			type: 'local'
		}, {
			type: 'global'
		}]
	},
	fetchOnScroll: true,
	showMaps: true,
	showPostFormOnTopOfTl: false,
	circleIcons: true,
	gradientWindowHeader: false,
	showReplyTarget: true,
	showMyRenotes: true,
	showRenotedMyNotes: true,
	loadRemoteMedia: true,
	disableViaMobile: false,
	memo: null
};

const defaultDeviceSettings = {
	apiViaStream: true,
	autoPopout: false,
	darkmode: false,
	enableSounds: true,
	soundVolume: 0.5,
	lang: null,
	preventUpdate: false,
	debug: false,
	lightmode: false,
	loadRawImages: false,
	postStyle: 'standard'
};

export default (os: MiOS) => new Vuex.Store({
	plugins: [createPersistedState({
		paths: ['i', 'device', 'settings']
	})],

	state: {
		i: null,
		indicate: false,
		uiHeaderHeight: 0
	},

	getters: {
		isSignedIn: state => state.i != null
	},

	mutations: {
		updateI(state, x) {
			state.i = x;
		},

		updateIKeyValue(state, x) {
			state.i[x.key] = x.value;
		},

		indicate(state, x) {
			state.indicate = x;
		},

		setUiHeaderHeight(state, height) {
			state.uiHeaderHeight = height;
		}
	},

	actions: {
		login(ctx, i) {
			ctx.commit('updateI', i);
			ctx.dispatch('settings/merge', i.clientSettings);
		},

		logout(ctx) {
			ctx.commit('updateI', null);
			document.cookie = `i=; domain=${hostname}; expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
		},

		mergeMe(ctx, me) {
			Object.entries(me).forEach(([key, value]) => {
				ctx.commit('updateIKeyValue', { key, value });
			});

			if (me.clientSettings) {
				ctx.dispatch('settings/merge', me.clientSettings);
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
				}
			}
		},

		settings: {
			namespaced: true,

			state: defaultSettings,

			mutations: {
				set(state, x: { key: string; value: any }) {
					state[x.key] = x.value;
				},

				setHome(state, data) {
					state.home = data;
				},

				setHomeWidget(state, x) {
					const w = state.home.find(w => w.id == x.id);
					if (w) {
						w.data = x.data;
					}
				},

				addHomeWidget(state, widget) {
					state.home.unshift(widget);
				},

				setMobileHome(state, data) {
					state.mobileHome = data;
				},

				setMobileHomeWidget(state, x) {
					const w = state.mobileHome.find(w => w.id == x.id);
					if (w) {
						w.data = x.data;
					}
				},

				addMobileHomeWidget(state, widget) {
					state.mobileHome.unshift(widget);
				},

				removeMobileHomeWidget(state, widget) {
					state.mobileHome = state.mobileHome.filter(w => w.id != widget.id);
				}
			},

			actions: {
				merge(ctx, settings) {
					if (settings == null) return;
					Object.entries(settings).forEach(([key, value]) => {
						ctx.commit('set', { key, value });
					});
				},

				set(ctx, x) {
					ctx.commit('set', x);

					if (ctx.rootGetters.isSignedIn) {
						os.api('i/update_client_setting', {
							name: x.key,
							value: x.value
						});
					}
				},

				addHomeWidget(ctx, widget) {
					ctx.commit('addHomeWidget', widget);

					os.api('i/update_home', {
						home: ctx.state.home
					});
				},

				addMobileHomeWidget(ctx, widget) {
					ctx.commit('addMobileHomeWidget', widget);

					os.api('i/update_mobile_home', {
						home: ctx.state.mobileHome
					});
				},

				removeMobileHomeWidget(ctx, widget) {
					ctx.commit('removeMobileHomeWidget', widget);

					os.api('i/update_mobile_home', {
						home: ctx.state.mobileHome.filter(w => w.id != widget.id)
					});
				}
			}
		}
	}
});
