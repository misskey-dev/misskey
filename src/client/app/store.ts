import Vuex from 'vuex';
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

export default (os: MiOS) => new Vuex.Store({
	plugins: [store => {
		store.subscribe((mutation, state) => {
			if (mutation.type.startsWith('settings/')) {
				localStorage.setItem('settings', JSON.stringify(state.settings.data));
			}
		});
	}],

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
		settings: {
			namespaced: true,

			state: {
				data: defaultSettings
			},

			mutations: {
				set(state, x: { key: string; value: any }) {
					state.data[x.key] = x.value;
				},

				setHome(state, data) {
					state.data.home = data;
				},

				setHomeWidget(state, x) {
					const w = state.data.home.find(w => w.id == x.id);
					if (w) {
						w.data = x.data;
					}
				},

				addHomeWidget(state, widget) {
					state.data.home.unshift(widget);
				},

				setMobileHome(state, data) {
					state.data.mobileHome = data;
				},

				setMobileHomeWidget(state, x) {
					const w = state.data.mobileHome.find(w => w.id == x.id);
					if (w) {
						w.data = x.data;
					}
				},

				addMobileHomeWidget(state, widget) {
					state.data.mobileHome.unshift(widget);
				},

				removeMobileHomeWidget(state, widget) {
					state.data.mobileHome = state.data.mobileHome.filter(w => w.id != widget.id);
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
						home: ctx.state.data.home
					});
				},

				addMobileHomeWidget(ctx, widget) {
					ctx.commit('addMobileHomeWidget', widget);

					os.api('i/update_mobile_home', {
						home: ctx.state.data.mobileHome
					});
				},

				removeMobileHomeWidget(ctx, widget) {
					ctx.commit('removeMobileHomeWidget', widget);

					os.api('i/update_mobile_home', {
						home: ctx.state.data.mobileHome.filter(w => w.id != widget.id)
					});
				}
			}
		}
	}
});
