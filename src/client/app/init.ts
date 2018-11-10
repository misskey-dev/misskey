/**
 * App initializer
 */

import Vue from 'vue';
import Vuex from 'vuex';
import VueRouter from 'vue-router';
import VAnimateCss from 'v-animate-css';
import VModal from 'vue-js-modal';
import VueSweetalert2 from 'vue-sweetalert2';
import VueI18n from 'vue-i18n';

import VueHotkey from './common/hotkey';
import App from './app.vue';
import checkForUpdate from './common/scripts/check-for-update';
import MiOS from './mios';
import { clientVersion as version, codename, lang } from './config';
import { builtinThemes, lightTheme, applyTheme } from './theme';

if (localStorage.getItem('theme') == null) {
	applyTheme(lightTheme);
}

//#region FontAwesome
import { library } from '@fortawesome/fontawesome-svg-core';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';

/* なぜか動かない
import faRetweet from '@fortawesome/free-solid-svg-icons/faRetweet';
import faPlus from '@fortawesome/free-solid-svg-icons/faPlus';
import faUser from '@fortawesome/free-solid-svg-icons/faUser';
import faCog from '@fortawesome/free-solid-svg-icons/faCog';
import faCheck from '@fortawesome/free-solid-svg-icons/faCheck';
import faStar from '@fortawesome/free-solid-svg-icons/faStar';
import faReply from '@fortawesome/free-solid-svg-icons/faReply';
import faEllipsisH from '@fortawesome/free-solid-svg-icons/faEllipsisH';
import faQuoteLeft from '@fortawesome/free-solid-svg-icons/faQuoteLeft';
import faQuoteRight from '@fortawesome/free-solid-svg-icons/faQuoteRight';
import faAngleUp from '@fortawesome/free-solid-svg-icons/faAngleUp';
import faAngleDown from '@fortawesome/free-solid-svg-icons/faAngleDown';
import faAt from '@fortawesome/free-solid-svg-icons/faAt';
import faHashtag from '@fortawesome/free-solid-svg-icons/faHashtag';
import faHome from '@fortawesome/free-solid-svg-icons/faHome';
import faGlobe from '@fortawesome/free-solid-svg-icons/faGlobe';
import faCircle from '@fortawesome/free-solid-svg-icons/faCircle';
import faList from '@fortawesome/free-solid-svg-icons/faList';
import faHeart from '@fortawesome/free-solid-svg-icons/faHeart';
import faUnlock from '@fortawesome/free-solid-svg-icons/faUnlock';
import faRssSquare from '@fortawesome/free-solid-svg-icons/faRssSquare';
import faSort from '@fortawesome/free-solid-svg-icons/faSort';
import faChartPie from '@fortawesome/free-solid-svg-icons/faChartPie';
import faChartBar from '@fortawesome/free-solid-svg-icons/faChartBar';
import faPencilAlt from '@fortawesome/free-solid-svg-icons/faPencilAlt';
import faColumns from '@fortawesome/free-solid-svg-icons/faColumns';
import faComments from '@fortawesome/free-solid-svg-icons/faComments';
import faGamepad from '@fortawesome/free-solid-svg-icons/faGamepad';
import faCloud from '@fortawesome/free-solid-svg-icons/faCloud';
import faPowerOff from '@fortawesome/free-solid-svg-icons/faPowerOff';
import faChevronCircleLeft from '@fortawesome/free-solid-svg-icons/faChevronCircleLeft';
import faChevronCircleRight from '@fortawesome/free-solid-svg-icons/faChevronCircleRight';
import faShareAlt from '@fortawesome/free-solid-svg-icons/faShareAlt';
import faTimes from '@fortawesome/free-solid-svg-icons/faTimes';
import faThumbtack from '@fortawesome/free-solid-svg-icons/faThumbtack';
import faSearch from '@fortawesome/free-solid-svg-icons/faSearch';

import farBell from '@fortawesome/free-regular-svg-icons/faBell';
import farEnvelope from '@fortawesome/free-regular-svg-icons/faEnvelope';
import farComments from '@fortawesome/free-regular-svg-icons/faComments';

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
	farBell,
	farEnvelope,
	farComments,
);
*/

import { fas } from '@fortawesome/free-solid-svg-icons';
import { far } from '@fortawesome/free-regular-svg-icons';

library.add(fas, far);
//#endregion

Vue.use(Vuex);
Vue.use(VueRouter);
Vue.use(VAnimateCss);
Vue.use(VModal);
Vue.use(VueHotkey);
Vue.use(VueSweetalert2);
Vue.use(VueI18n);

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
	'%c%i18n:common.do-not-copy-paste%',
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
export default (callback: (launch: (router: VueRouter) => [Vue, MiOS]) => void, sw = false) => {
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

			//#region shadow
			const shadow = '0 3px 8px rgba(0, 0, 0, 0.2)';
			const shadowRight = '4px 0 4px rgba(0, 0, 0, 0.1)';
			const shadowLeft = '-4px 0 4px rgba(0, 0, 0, 0.1)';
			if (os.store.state.settings.useShadow) document.documentElement.style.setProperty('--shadow', shadow);
			if (os.store.state.settings.useShadow) document.documentElement.style.setProperty('--shadowRight', shadowRight);
			if (os.store.state.settings.useShadow) document.documentElement.style.setProperty('--shadowLeft', shadowLeft);
			os.store.watch(s => {
				return s.settings.useShadow;
			}, v => {
				document.documentElement.style.setProperty('--shadow', v ? shadow : 'none');
				document.documentElement.style.setProperty('--shadowRight', v ? shadowRight : 'none');
				document.documentElement.style.setProperty('--shadowLeft', v ? shadowLeft : 'none');
			});
			//#endregion

			//#region rounded corners
			const round = '6px';
			if (os.store.state.settings.roundedCorners) document.documentElement.style.setProperty('--round', round);
			os.store.watch(s => {
				return s.settings.roundedCorners;
			}, v => {
				document.documentElement.style.setProperty('--round', v ? round : '0');
			});
			//#endregion

			// Navigation hook
			router.beforeEach((to, from, next) => {
				if (os.store.state.navHook) {
					if (os.store.state.navHook(to)) {
						next(false);
					} else {
						next();
					}
				} else {
					next();
				}
			});

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
				i18n: new VueI18n({
					sync: false,
					locale: lang,
					messages: {
						[lang]: {}
					}
				}),
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
				},
				router,
				render: createEl => createEl(App)
			});

			os.app = app;

			// マウント
			app.$mount('#app');

			//#region 更新チェック
			const preventUpdate = os.store.state.device.preventUpdate;
			if (!preventUpdate) {
				setTimeout(() => {
					checkForUpdate(app);
				}, 3000);
			}
			//#endregion

			return [app, os] as [Vue, MiOS];
		};

		callback(launch);
	});
};
