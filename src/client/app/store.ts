import Vue from 'vue';
import Vuex from 'vuex';
import createPersistedState from 'vuex-persistedstate';
import * as nestedProperty from 'nested-property';

import MiOS from './mios';
import { erase } from '../../prelude/array';
import getNoteSummary from '../../misc/get-note-summary';
import { instanceHost } from './config';

const defaultSettings = {
	keepCw: false,
	tagTimelines: [],
	fetchOnScroll: true,
	remainDeletedNote: false,
	showPostFormOnTopOfTl: false,
	suggestRecentHashtags: true,
	showClockOnHeader: true,
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
	wallpaper: null,
	webSearchEngine: 'https://www.google.com/?#q={{query}}',
	mutedWords: [],
	gamesReversiShowBoardLabels: false,
	gamesReversiUseAvatarStones: true,
	disableAnimatedMfm: false,
	homeProfiles: {},
	mobileHomeProfiles: {},
	deckProfiles: {},
	uploadFolder: null,
	pastedFileName: 'yyyy-MM-dd HH-mm-ss [{{number}}]',
	pasteDialog: false,
	reactions: ['like', 'love', 'laugh', 'hmm', 'surprise', 'congrats', 'angry', 'confused', 'rip', 'pudding']
};

const defaultDeviceSettings = {
	homeProfile: 'Default',
	mobileHomeProfile: 'Default',
	deckProfile: 'Default',
	deckMode: false,
	deckColumnAlign: 'center',
	deckColumnWidth: 'normal',
	useShadow: false,
	roundedCorners: true,
	reduceMotion: false,
	darkmode: true,
	darkTheme: 'bb5a8287-a072-4b0a-8ae5-ea2a0d33f4f2',
	lightTheme: 'light',
	lineWidth: 1,
	fontSize: 0,
	themes: [],
	enableSounds: true,
	soundVolume: 0.5,
	mediaVolume: 0.5,
	lang: null,
	appTypeForce: 'auto',
	debug: false,
	lightmode: false,
	loadRawImages: false,
	alwaysShowNsfw: false,
	postStyle: 'standard',
	navbar: 'top',
	mobileNotificationPosition: 'bottom',
	useOsDefaultEmojis: false,
	disableShowingAnimatedImages: false,
	expandUsersPhotos: true,
	expandUsersActivity: true,
	enableMobileQuickNotificationView: false,
	roomGraphicsQuality: 'medium',
	roomUseOrthographicCamera: true,
	activeEmojiCategoryName: undefined,
	recentEmojis: [],
};

export default (os: MiOS) => new Vuex.Store({
	plugins: [createPersistedState({
		paths: ['i', 'device', 'settings'],
		storage: {
			getItem: (k) => localStorage.getItem(`${k}:${instanceHost}`),
			setItem: (k, v) => localStorage.setItem(`${k}:${instanceHost}`, v),
			removeItem: (k) => localStorage.removeItem(`${k}:${instanceHost}`),
		}
	})],

	state: {
		i: null,
		indicate: false,
		uiHeaderHeight: 0,
		behindNotes: []
	},

	getters: {
		isSignedIn: state => state.i != null,

		home: state => state.settings.homeProfiles[state.device.homeProfile],

		mobileHome: state => state.settings.mobileHomeProfiles[state.device.mobileHomeProfile],

		deck: state => state.settings.deckProfiles[state.device.deckProfile],
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
		},

		setHome(state, data) {
			Vue.set(state.settings.homeProfiles, state.device.homeProfile, data);
			os.store.dispatch('settings/updateHomeProfile');
		},

		setDeck(state, data) {
			Vue.set(state.settings.deckProfiles, state.device.deckProfile, data);
			os.store.dispatch('settings/updateDeckProfile');
		},

		addHomeWidget(state, widget) {
			state.settings.homeProfiles[state.device.homeProfile].unshift(widget);
			os.store.dispatch('settings/updateHomeProfile');
		},

		setMobileHome(state, data) {
			Vue.set(state.settings.mobileHomeProfiles, state.device.mobileHomeProfile, data);
			os.store.dispatch('settings/updateMobileHomeProfile');
		},

		updateWidget(state, x) {
			let w;

			//#region Desktop home
			const home = state.settings.homeProfiles[state.device.homeProfile];
			if (home) {
				w = home.find(w => w.id == x.id);
				if (w) {
					w.data = x.data;
					os.store.dispatch('settings/updateHomeProfile');
				}
			}
			//#endregion

			//#region Mobile home
			const mobileHome = state.settings.mobileHomeProfiles[state.device.mobileHomeProfile];
			if (mobileHome) {
				w = mobileHome.find(w => w.id == x.id);
				if (w) {
					w.data = x.data;
					os.store.dispatch('settings/updateMobileHomeProfile');
				}
			}
			//#endregion
		},

		addMobileHomeWidget(state, widget) {
			state.settings.mobileHomeProfiles[state.device.mobileHomeProfile].unshift(widget);
			os.store.dispatch('settings/updateMobileHomeProfile');
		},

		removeMobileHomeWidget(state, widget) {
			Vue.set('state.settings.mobileHomeProfiles', state.device.mobileHomeProfile, state.settings.mobileHomeProfiles[state.device.mobileHomeProfile].filter(w => w.id != widget.id));
			os.store.dispatch('settings/updateMobileHomeProfile');
		},

		addDeckColumn(state, column) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			if (column.name == undefined) column.name = null;
			deck.columns.push(column);
			deck.layout.push([column.id]);
			os.store.dispatch('settings/updateDeckProfile');
		},

		removeDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			deck.columns = deck.columns.filter(c => c.id != id);
			deck.layout = deck.layout.map(ids => erase(id, ids));
			deck.layout = deck.layout.filter(ids => ids.length > 0);
			os.store.dispatch('settings/updateDeckProfile');
		},

		swapDeckColumn(state, x) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const a = x.a;
			const b = x.b;
			const aX = deck.layout.findIndex(ids => ids.indexOf(a) != -1);
			const aY = deck.layout[aX].findIndex(id => id == a);
			const bX = deck.layout.findIndex(ids => ids.indexOf(b) != -1);
			const bY = deck.layout[bX].findIndex(id => id == b);
			deck.layout[aX][aY] = b;
			deck.layout[bX][bY] = a;
			os.store.dispatch('settings/updateDeckProfile');
		},

		swapLeftDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			deck.layout.some((ids, i) => {
				if (ids.indexOf(id) != -1) {
					const left = deck.layout[i - 1];
					if (left) {
						// https://vuejs.org/v2/guide/list.html#Caveats
						//state.deck.layout[i - 1] = state.deck.layout[i];
						//state.deck.layout[i] = left;
						deck.layout.splice(i - 1, 1, deck.layout[i]);
						deck.layout.splice(i, 1, left);
					}
					return true;
				}
			});
			os.store.dispatch('settings/updateDeckProfile');
		},

		swapRightDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			deck.layout.some((ids, i) => {
				if (ids.indexOf(id) != -1) {
					const right = deck.layout[i + 1];
					if (right) {
						// https://vuejs.org/v2/guide/list.html#Caveats
						//state.deck.layout[i + 1] = state.deck.layout[i];
						//state.deck.layout[i] = right;
						deck.layout.splice(i + 1, 1, deck.layout[i]);
						deck.layout.splice(i, 1, right);
					}
					return true;
				}
			});
			os.store.dispatch('settings/updateDeckProfile');
		},

		swapUpDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const ids = deck.layout.find(ids => ids.indexOf(id) != -1);
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
			os.store.dispatch('settings/updateDeckProfile');
		},

		swapDownDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const ids = deck.layout.find(ids => ids.indexOf(id) != -1);
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
			os.store.dispatch('settings/updateDeckProfile');
		},

		stackLeftDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const i = deck.layout.findIndex(ids => ids.indexOf(id) != -1);
			deck.layout = deck.layout.map(ids => erase(id, ids));
			const left = deck.layout[i - 1];
			if (left) deck.layout[i - 1].push(id);
			deck.layout = deck.layout.filter(ids => ids.length > 0);
			os.store.dispatch('settings/updateDeckProfile');
		},

		popRightDeckColumn(state, id) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const i = deck.layout.findIndex(ids => ids.indexOf(id) != -1);
			deck.layout = deck.layout.map(ids => erase(id, ids));
			deck.layout.splice(i + 1, 0, [id]);
			deck.layout = deck.layout.filter(ids => ids.length > 0);
			os.store.dispatch('settings/updateDeckProfile');
		},

		addDeckWidget(state, x) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const column = deck.columns.find(c => c.id == x.id);
			if (column == null) return;
			column.widgets.unshift(x.widget);
			os.store.dispatch('settings/updateDeckProfile');
		},

		removeDeckWidget(state, x) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const column = deck.columns.find(c => c.id == x.id);
			if (column == null) return;
			column.widgets = column.widgets.filter(w => w.id != x.widget.id);
			os.store.dispatch('settings/updateDeckProfile');
		},

		renameDeckColumn(state, x) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			const column = deck.columns.find(c => c.id == x.id);
			if (column == null) return;
			column.name = x.name;
			os.store.dispatch('settings/updateDeckProfile');
		},

		updateDeckColumn(state, x) {
			const deck = state.settings.deckProfiles[state.device.deckProfile];
			let column = deck.columns.find(c => c.id == x.id);
			if (column == null) return;
			column = x;
			os.store.dispatch('settings/updateDeckProfile');
		}
	},

	actions: {
		login(ctx, i) {
			ctx.commit('updateI', i);
			ctx.dispatch('settings/merge', i.clientData);
		},

		logout(ctx) {
			ctx.commit('updateI', null);
			document.cookie = `i=; max-age=0; domain=${document.location.hostname}`;
			localStorage.removeItem(`i:${instanceHost}`);
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

				updateHomeProfile(ctx) {
					const profiles = ctx.state.homeProfiles;
					ctx.commit('set', {
						key: 'homeProfiles',
						value: profiles
					});
					os.api('i/update-client-setting', {
						name: 'homeProfiles',
						value: profiles
					});
				},

				updateMobileHomeProfile(ctx) {
					const profiles = ctx.state.mobileHomeProfiles;
					ctx.commit('set', {
						key: 'mobileHomeProfiles',
						value: profiles
					});
					os.api('i/update-client-setting', {
						name: 'mobileHomeProfiles',
						value: profiles
					});
				},

				updateDeckProfile(ctx) {
					const profiles = ctx.state.deckProfiles;
					ctx.commit('set', {
						key: 'deckProfiles',
						value: profiles
					});
					os.api('i/update-client-setting', {
						name: 'deckProfiles',
						value: profiles
					});
				},
			}
		}
	}
});
