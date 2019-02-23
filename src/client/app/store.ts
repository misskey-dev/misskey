import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import * as nestedProperty from 'nested-property';

import MiOS from './mios';
import { erase } from '../../prelude/array';
import getNoteSummary from '../../misc/get-note-summary';

const defaultSettings = {
	home: null,
	mobileHome: [],
	deck: null,
	keepCw: false,
	tagTimelines: [],
	fetchOnScroll: true,
	showMaps: true,
	remainDeletedNote: false,
	showPostFormOnTopOfTl: false,
	suggestRecentHashtags: true,
	showClockOnHeader: true,
	useShadow: true,
	roundedCorners: false,
	circleIcons: true,
	contrastedAcct: true,
	showFullAcct: false,
	showVia: true,
	showReplyTarget: true,
	showMyRenotes: true,
	showRenotedMyNotes: true,
	showLocalRenotes: true,
	loadRemoteMedia: true,
	disableViaMobile: false,
	memo: null,
	iLikeSushi: false,
	rememberNoteVisibility: false,
	defaultNoteVisibility: 'public',
	webSearchEngine: 'https://www.google.com/?#q={{query}}',
	mutedWords: [],
	games: {
		reversi: {
			showBoardLabels: false,
			useAvatarStones: true,
		}
	}
};

const defaultDeviceSettings = {
	reduceMotion: false,
	autoPopout: false,
	darkmode: false,
	darkTheme: 'dark',
	lightTheme: 'light',
	lineWidth: 1,
	themes: [],
	enableSounds: true,
	soundVolume: 0.5,
	mediaVolume: 0.5,
	lang: null,
	preventUpdate: false,
	debug: false,
	lightmode: false,
	loadRawImages: false,
	alwaysShowNsfw: false,
	postStyle: 'standard',
	navbar: 'top',
	deckColumnAlign: 'center',
	deckColumnWidth: 'normal',
	mobileNotificationPosition: 'bottom',
	deckMode: false,
	useOsDefaultEmojis: false,
	disableShowingAnimatedImages: false,
	expandUsersPhotos: true,
	expandUsersActivity: true,
};

export default (os: MiOS) => new Vuex.Store({
	plugins: [createPersistedState({
		paths: ['i', 'device', 'settings']
	})],

	state: {
		i: null,
		indicate: false,
		uiHeaderHeight: 0,
		behindNotes: []
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
		},

		pushBehindNote(state, note) {
			if (note.userId === state.i.id) return;
			if (state.behindNotes.some(n => n.id === note.id)) return;
			state.behindNotes.push(note);
			document.title = `(${state.behindNotes.length}) ${getNoteSummary(note)}`;
		},

		clearBehindNotes(state) {
			state.behindNotes = [];
			document.title = os.instanceName;
		}
	},

	actions: {
		login(ctx, i) {
			ctx.commit('updateI', i);
			ctx.dispatch('settings/merge', i.clientSettings);
		},

		logout(ctx) {
			ctx.commit('updateI', null);
			document.cookie = 'i=;';
			localStorage.removeItem('i');
		},

		mergeMe(ctx, me) {
			for (const [key, value] of Object.entries(me)) {
				ctx.commit('updateIKeyValue', { key, value });
			}

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
				},

				setVisibility(state, visibility) {
					state.visibility = visibility;
				}
			}
		},

		settings: {
			namespaced: true,

			state: defaultSettings,

			mutations: {
				set(state, x: { key: string; value: any }) {
					nestedProperty.set(state, x.key, x.value);
				},

				setHome(state, data) {
					state.home = data;
				},

				addHomeWidget(state, widget) {
					state.home.unshift(widget);
				},

				setMobileHome(state, data) {
					state.mobileHome = data;
				},

				setWidget(state, x) {
					let w;

					//#region Decktop home
					if (state.home) {
						w = state.home.find(w => w.id == x.id);
						if (w) {
							w.data = x.data;
						}
					}
					//#endregion

					//#region Mobile home
					if (state.mobileHome) {
						w = state.mobileHome.find(w => w.id == x.id);
						if (w) {
							w.data = x.data;
						}
					}
					//#endregion

					//#region Deck
					if (state.deck && state.deck.columns) {
						for (const c of state.deck.columns.filter(c => c.type == 'widgets')) {
							for (const w of c.widgets.filter(w => w.id == x.id)) {
								w.data = x.data;
							}
						}
					}
					//#endregion
				},

				addMobileHomeWidget(state, widget) {
					state.mobileHome.unshift(widget);
				},

				removeMobileHomeWidget(state, widget) {
					state.mobileHome = state.mobileHome.filter(w => w.id != widget.id);
				},

				addDeckColumn(state, column) {
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
								state.deck.layout[i - 1] = state.deck.layout[i];
								state.deck.layout[i] = left;
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
								state.deck.layout[i + 1] = state.deck.layout[i];
								state.deck.layout[i] = right;
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
								ids[i - 1] = id;
								ids[i] = up;
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
								ids[i + 1] = id;
								ids[i] = down;
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
				}
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
						os.api('i/update_client_setting', {
							name: x.key,
							value: x.value
						});
					}
				},

				saveDeck(ctx) {
					os.api('i/update_client_setting', {
						name: 'deck',
						value: ctx.state.deck
					});
				},

				addDeckColumn(ctx, column) {
					ctx.commit('addDeckColumn', column);
					ctx.dispatch('saveDeck');
				},

				removeDeckColumn(ctx, id) {
					ctx.commit('removeDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				swapDeckColumn(ctx, id) {
					ctx.commit('swapDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				swapLeftDeckColumn(ctx, id) {
					ctx.commit('swapLeftDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				swapRightDeckColumn(ctx, id) {
					ctx.commit('swapRightDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				swapUpDeckColumn(ctx, id) {
					ctx.commit('swapUpDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				swapDownDeckColumn(ctx, id) {
					ctx.commit('swapDownDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				stackLeftDeckColumn(ctx, id) {
					ctx.commit('stackLeftDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				popRightDeckColumn(ctx, id) {
					ctx.commit('popRightDeckColumn', id);
					ctx.dispatch('saveDeck');
				},

				addDeckWidget(ctx, x) {
					ctx.commit('addDeckWidget', x);
					ctx.dispatch('saveDeck');
				},

				removeDeckWidget(ctx, x) {
					ctx.commit('removeDeckWidget', x);
					ctx.dispatch('saveDeck');
				},

				renameDeckColumn(ctx, x) {
					ctx.commit('renameDeckColumn', x);
					ctx.dispatch('saveDeck');
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
