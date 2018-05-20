import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';

import MiOS from './mios';

const defaultSettings = {
	home: [],
	mobileHome: [],
	fetchOnScroll: true,
	showMaps: true,
	showPostFormOnTopOfTl: false,
	circleIcons: true,
	gradientWindowHeader: false,
	showReplyTarget: true,
	showMyRenotes: true,
	showRenotedMyNotes: true
};

const defaultDeviceSettings = {
	apiViaStream: true,
	autoPopout: false,
	enableSounds: true,
	soundVolume: 0.5,
	lang: null,
	preventUpdate: false,
	debug: false,
	lightmode: false,
};

export default (os: MiOS) => new Vuex.Store({
	plugins: [store => {
		store.subscribe((mutation, state) => {
			if (mutation.type.startsWith('settings/')) {
				localStorage.setItem('settings', JSON.stringify(state.settings));
			}
		});
	}, createPersistedState({
		paths: ['device'],
		filter: mut => mut.type.startsWith('device/')
	})],

	state: {
		indicate: false,
		uiHeaderHeight: 0
	},

	mutations: {
		indicate(state, x) {
			state.indicate = x;
		},

		setUiHeaderHeight(state, height) {
			state.uiHeaderHeight = height;
		}
	},

	modules: {
		device: {
			namespaced: true,

			state: defaultDeviceSettings,

			mutations: {
				set(state, x: { key: string; value: any }) {
					state[x.key] = x.value;
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
					Object.entries(settings).forEach(([key, value]) => {
						ctx.commit('set', { key, value });
					});
				},

				set(ctx, x) {
					ctx.commit('set', x);

					if (os.isSignedIn) {
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
