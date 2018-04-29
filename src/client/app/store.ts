import Vuex from 'vuex';
import MiOS from './common/mios';

const defaultSettings = {
	home: [],
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
		uiHeaderHeight: 0
	},

	mutations: {
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
				init(state, settings) {
					state.data = settings;
				},

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
				}
			},

			actions: {
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
				}
			}
		}
	}
});
