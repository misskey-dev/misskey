/**
 * App initializer
 */

import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VAnimateCss from 'v-animate-css';
import VModal from 'vue-js-modal';
import VueI18n from 'vue-i18n';
import SequentialEntrance from 'vue-sequential-entrance';

import VueHotkey from './common/hotkey';
import VueSize from './common/size';
import App from './app.vue';
import checkForUpdate from './common/scripts/check-for-update';
import MiOS from './mios';
import { version, codename, lang, locale } from './config';
import { builtinThemes, applyTheme, darkTheme } from './theme';
import Dialog from './common/views/components/dialog.vue';

if (localStorage.getItem('theme') == null) {
	applyTheme(darkTheme);
}

//#region FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

import {
	faRetweet,
	faPlus,
	faUser,
	faCog,
	faCheck,
	faStar,
	faReply,
	faEllipsisH,
	faQuoteLeft,
	faQuoteRight,
	faAngleUp,
	faAngleDown,
	faAt,
	faHashtag,
	faHome,
	faGlobe,
	faCircle,
	faList,
	faHeart,
	faUnlock,
	faRssSquare,
	faSort,
	faChartPie,
	faChartBar,
	faPencilAlt,
	faColumns,
	faComments,
	faGamepad,
	faCloud,
	faPowerOff,
	faChevronCircleLeft,
	faChevronCircleRight,
	faShareAlt,
	faTimes,
	faThumbtack,
	faSearch,
	faAngleRight,
	faWrench,
	faTerminal,
	faMoon,
	faPalette,
	faSlidersH,
	faDesktop,
	faVolumeUp,
	faLanguage,
	faInfoCircle,
	faExclamationTriangle,
	faKey,
	faBan,
	faCogs,
	faUnlockAlt,
	faPuzzlePiece,
	faMobileAlt,
	faSignInAlt,
	faSyncAlt,
	faPaperPlane,
	faUpload,
	faMapMarkerAlt,
	faEnvelope,
	faLock,
	faFolderOpen,
	faBirthdayCake,
	faImage,
	faEye,
	faDownload,
	faFileImport,
	faLink,
	faArrowRight,
	faICursor,
	faCaretRight,
	faReplyAll,
	faCamera,
	faMinus,
	faCaretDown,
	faCalculator,
	faUsers,
	faBars,
	faFileImage,
	faPollH,
	faFolder,
	faMicrochip,
	faMemory,
	faServer,
	faExclamationCircle,
	faSpinner,
	faBroadcastTower,
	faChartLine,
	faEllipsisV,
	faStickyNote,
	faUserClock,
	faUserPlus,
	faExternalLinkSquareAlt,
	faSync,
	faArrowLeft,
	faMapMarker,
	faRobot,
	faHourglassHalf,
	faGavel
} from '@fortawesome/free-solid-svg-icons';

import {
	faBell as farBell,
	faEnvelope as farEnvelope,
	faComments as farComments,
	faTrashAlt as farTrashAlt,
	faWindowRestore as farWindowRestore,
	faFolder as farFolder,
	faLaugh as farLaugh,
	faSmile as farSmile,
	faEyeSlash as farEyeSlash,
	faFolderOpen as farFolderOpen,
	faSave as farSave,
	faImages as farImages,
	faChartBar as farChartBar,
	faCommentAlt as farCommentAlt,
	faClock as farClock,
	faCalendarAlt as farCalendarAlt,
	faHdd as farHdd,
	faMoon as farMoon,
	faPlayCircle as farPlayCircle,
	faLightbulb as farLightbulb,
	faStickyNote as farStickyNote,
} from '@fortawesome/free-regular-svg-icons';

import {
	faTwitter as fabTwitter,
	faGithub as fabGithub,
	faDiscord as fabDiscord
} from '@fortawesome/free-brands-svg-icons';
import i18n from './i18n';

library.add(
	faRetweet,
	faPlus,
	faUser,
	faCog,
	faCheck,
	faStar,
	faReply,
	faEllipsisH,
	faQuoteLeft,
	faQuoteRight,
	faAngleUp,
	faAngleDown,
	faAt,
	faHashtag,
	faHome,
	faGlobe,
	faCircle,
	faList,
	faHeart,
	faUnlock,
	faRssSquare,
	faSort,
	faChartPie,
	faChartBar,
	faPencilAlt,
	faColumns,
	faComments,
	faGamepad,
	faCloud,
	faPowerOff,
	faChevronCircleLeft,
	faChevronCircleRight,
	faShareAlt,
	faTimes,
	faThumbtack,
	faSearch,
	faAngleRight,
	faWrench,
	faTerminal,
	faMoon,
	faPalette,
	faSlidersH,
	faDesktop,
	faVolumeUp,
	faLanguage,
	faInfoCircle,
	faExclamationTriangle,
	faKey,
	faBan,
	faCogs,
	faUnlockAlt,
	faPuzzlePiece,
	faMobileAlt,
	faSignInAlt,
	faSyncAlt,
	faPaperPlane,
	faUpload,
	faMapMarkerAlt,
	faEnvelope,
	faLock,
	faFolderOpen,
	faBirthdayCake,
	faImage,
	faEye,
	faDownload,
	faFileImport,
	faLink,
	faArrowRight,
	faICursor,
	faCaretRight,
	faReplyAll,
	faCamera,
	faMinus,
	faCaretDown,
	faCalculator,
	faUsers,
	faBars,
	faFileImage,
	faPollH,
	faFolder,
	faMicrochip,
	faMemory,
	faServer,
	faExclamationCircle,
	faSpinner,
	faBroadcastTower,
	faChartLine,
	faEllipsisV,
	faStickyNote,
	faUserClock,
	faUserPlus,
	faExternalLinkSquareAlt,
	faSync,
	faArrowLeft,
	faMapMarker,
	faRobot,
	faHourglassHalf,
	faGavel,

	farBell,
	farEnvelope,
	farComments,
	farTrashAlt,
	farWindowRestore,
	farFolder,
	farLaugh,
	farSmile,
	farEyeSlash,
	farFolderOpen,
	farSave,
	farImages,
	farChartBar,
	farCommentAlt,
	farClock,
	farCalendarAlt,
	farHdd,
	farMoon,
	farPlayCircle,
	farLightbulb,
	farStickyNote,

	fabTwitter,
	fabGithub,
	fabDiscord
);
//#endregion

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VAnimateCss);
Vue.use(VModal);
Vue.use(VueHotkey);
Vue.use(VueSize);
Vue.use(VueI18n);
Vue.use(SequentialEntrance);

Vue.component('fa', FontAwesomeIcon);

// Register global directives
require('./common/views/directives');

// Register global components
require('./common/views/components');
require('./common/views/widgets');

// Register global filters
require('./common/views/filters');

Vue.mixin({
	methods: {
		destroyDom() {
			this.$destroy();

			if (this.$el.parentNode) {
				this.$el.parentNode.removeChild(this.$el);
			}
		}
	}
});

/**
 * APP ENTRY POINT!
 */

console.info(`Misskey v${version} (${codename})`);
console.info(
	`%c${locale['common']['do-not-copy-paste']}`,
	'color: red; background: yellow; font-size: 16px; font-weight: bold;');

// BootTimer解除
window.clearTimeout((window as any).mkBootTimer);
delete (window as any).mkBootTimer;

//#region Set lang attr
const html = document.documentElement;
html.setAttribute('lang', lang);
//#endregion

// iOSでプライベートモードだとlocalStorageが使えないので既存のメソッドを上書きする
try {
	localStorage.setItem('kyoppie', 'yuppie');
} catch (e) {
	Storage.prototype.setItem = () => { }; // noop
}

// クライアントを更新すべきならする
if (localStorage.getItem('should-refresh') == 'true') {
	localStorage.removeItem('should-refresh');
	location.reload(true);
}

// MiOSを初期化してコールバックする
export default (callback: (launch: (router: VueRouter) => [Vue, MiOS], os: MiOS) => void, sw = false) => {
	const os = new MiOS(sw);

	os.init(() => {
		// アプリ基底要素マウント
		document.body.innerHTML = '<div id="app"></div>';

		const launch = (router: VueRouter) => {
			//#region theme
			os.store.watch(s => {
				return s.device.darkmode;
			}, v => {
				const themes = os.store.state.device.themes.concat(builtinThemes);
				const dark = themes.find(t => t.id == os.store.state.device.darkTheme);
				const light = themes.find(t => t.id == os.store.state.device.lightTheme);
				applyTheme(v ? dark : light);
			});
			os.store.watch(s => {
				return s.device.lightTheme;
			}, v => {
				const themes = os.store.state.device.themes.concat(builtinThemes);
				const theme = themes.find(t => t.id == v);
				if (!os.store.state.device.darkmode) {
					applyTheme(theme);
				}
			});
			os.store.watch(s => {
				return s.device.darkTheme;
			}, v => {
				const themes = os.store.state.device.themes.concat(builtinThemes);
				const theme = themes.find(t => t.id == v);
				if (os.store.state.device.darkmode) {
					applyTheme(theme);
				}
			});
			//#endregion

			/*// Reapply current theme
			try {
				const themeName = os.store.state.device.darkmode ? os.store.state.device.darkTheme : os.store.state.device.lightTheme;
				const themes = os.store.state.device.themes.concat(builtinThemes);
				const theme = themes.find(t => t.id == themeName);
				if (theme) {
					applyTheme(theme);
				}
			} catch (e) {
				console.log(`Cannot reapply theme. ${e}`);
			}*/

			//#region line width
			document.documentElement.style.setProperty('--lineWidth', `${os.store.state.device.lineWidth}px`);
			os.store.watch(s => {
				return s.device.lineWidth;
			}, v => {
				document.documentElement.style.setProperty('--lineWidth', `${os.store.state.device.lineWidth}px`);
			});
			//#endregion

			//#region fontSize
			document.documentElement.style.setProperty('--fontSize', `${os.store.state.device.fontSize}px`);
			os.store.watch(s => {
				return s.device.fontSize;
			}, v => {
				document.documentElement.style.setProperty('--fontSize', `${os.store.state.device.fontSize}px`);
			});
			//#endregion

			document.addEventListener('visibilitychange', () => {
				if (!document.hidden) {
					os.store.commit('clearBehindNotes');
				}
			}, false);

			window.addEventListener('scroll', () => {
				if (window.scrollY <= 8) {
					os.store.commit('clearBehindNotes');
				}
			}, { passive: true });

			const app = new Vue({
				i18n: i18n(),
				store: os.store,
				data() {
					return {
						os: {
							windows: os.windows
						},
						stream: os.stream,
						instanceName: os.instanceName
					};
				},
				methods: {
					api: os.api,
					getMeta: os.getMeta,
					getMetaSync: os.getMetaSync,
					signout: os.signout,
					new(vm, props) {
						const x = new vm({
							parent: this,
							propsData: props
						}).$mount();
						document.body.appendChild(x.$el);
						return x;
					},
					dialog(opts) {
						const vm = this.new(Dialog, opts);
						return new Promise((res) => {
							vm.$once('ok', result => res({ canceled: false, result }));
							vm.$once('cancel', () => res({ canceled: true }));
						});
					}
				},
				router,
				render: createEl => createEl(App)
			});

			os.app = app;

			// マウント
			app.$mount('#app');

			//#region 更新チェック
			setTimeout(() => {
				checkForUpdate(app);
			}, 3000);
			//#endregion

			return [app, os] as [Vue, MiOS];
		};

		// Deck mode
		os.store.commit('device/set', {
			key: 'inDeckMode',
			value: os.store.getters.isSignedIn && os.store.state.device.deckMode
				&& (document.location.pathname === '/' || window.performance.navigation.type === 1)
		});

		callback(launch, os);
	});
};
