<template>
<div class="mk-app" v-hotkey.global="keymap" :class="{ wallpaper }">
	<XSidebar ref="nav" class="sidebar"/>

	<div class="contents" ref="contents">
		<header class="header" ref="header" @contextmenu.prevent.stop="onContextmenu" @click="onHeaderClick">
			<XHeader :info="pageInfo"/>
		</header>
		<main ref="main">
			<div class="content">
				<router-view v-slot="{ Component }">
					<transition :name="hotDeviceStorage.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['timeline']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
			<div class="spacer"></div>
		</main>
	</div>

	<XSide v-if="isDesktop" class="side" ref="side"/>

	<div v-if="isDesktop" class="widgets">
		<div ref="widgetsSpacer"></div>
		<XWidgets @mounted="attachSticky"/>
	</div>

	<div class="buttons" :class="{ navHidden }">
		<button class="button nav _button" @click="showNav" ref="navButton"><Fa :icon="faBars"/><i v-if="navIndicated"><Fa :icon="faCircle"/></i></button>
		<button v-if="$route.name === 'index'" class="button home _button" @click="top()"><Fa :icon="faHome"/></button>
		<button v-else class="button home _button" @click="$router.push('/')"><Fa :icon="faHome"/></button>
		<button class="button notifications _button" @click="$router.push('/my/notifications')"><Fa :icon="faBell"/><i v-if="$i.hasUnreadNotification"><Fa :icon="faCircle"/></i></button>
		<button class="button widget _button" @click="widgetsShowing = true"><Fa :icon="faLayerGroup"/></button>
	</div>

	<button class="widgetButton _button" :class="{ navHidden }" @click="widgetsShowing = true"><Fa :icon="faLayerGroup"/></button>

	<transition name="tray-back">
		<div class="tray-back _modalBg"
			v-if="widgetsShowing"
			@click="widgetsShowing = false"
			@touchstart.passive="widgetsShowing = false"
		></div>
	</transition>

	<transition name="tray">
		<XWidgets v-if="widgetsShowing" class="tray"/>
	</transition>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, markRaw } from 'vue';
import { faLayerGroup, faBars, faHome, faCircle, faWindowMaximize, faColumns } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { host } from '@/config';
import { search } from '@/scripts/search';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import XSidebar from '@/components/sidebar.vue';
import XCommon from './_common_/common.vue';
import XHeader from './_common_/header.vue';
import XSide from './default.side.vue';
import * as os from '@/os';
import { sidebarDef } from '@/sidebar';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XHeader,
		XWidgets: defineAsyncComponent(() => import('./default.widgets.vue')),
		XSide, // NOTE: dynamic importするとAsyncComponentWrapperが間に入るせいでref取得できなくて面倒になる
	},

	provide() {
		return {
			sideViewHook: this.isDesktop ? (url) => {
				this.$refs.side.navigate(url);
			} : null
		};
	},

	data() {
		return {
			host: host,
			pageKey: 0,
			pageInfo: null,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			menuDef: sidebarDef,
			navHidden: false,
			widgetsShowing: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faLayerGroup, faBars, faBell, faHome, faCircle,
		};
	},

	computed: {
		keymap(): any {
			return {
				'd': () => {
					if (this.$store.state.device.syncDeviceDarkMode) return;
					this.$store.commit('device/set', { key: 'darkMode', value: !this.$store.state.device.darkMode });
				},
				'p': os.post,
				'n': os.post,
				's': () => search(),
				'h|/': this.help
			};
		},

		widgets(): any {
			return this.$store.state.deviceUser.widgets;
		},

		menu(): string[] {
			return this.$store.state.deviceUser.menu;
		},

		navIndicated(): boolean {
			for (const def in this.menuDef) {
				if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		}
	},

	watch: {
		$route(to, from) {
			this.pageKey++;
		},
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';

		if (this.$store.state.deviceUser.widgets.length === 0) {
			this.$store.commit('deviceUser/setWidgets', [{
				name: 'calendar',
				id: 'a', place: 'right', data: {}
			}, {
				name: 'notifications',
				id: 'b', place: 'right', data: {}
			}, {
				name: 'trends',
				id: 'c', place: 'right', data: {}
			}]);
		}
	},

	mounted() {
		this.adjustUI();

		const ro = new ResizeObserver((entries, observer) => {
			this.adjustUI();
		});

		ro.observe(this.$refs.contents);

		window.addEventListener('resize', this.adjustUI, { passive: true });

		if (!this.isDesktop) {
			window.addEventListener('resize', () => {
				if (window.innerWidth >= DESKTOP_THRESHOLD) this.isDesktop = true;
			}, { passive: true });
		}
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page.INFO) {
				this.pageInfo = page.INFO;
			}
		},

		adjustUI() {
			const navWidth = this.$refs.nav.$el.offsetWidth;
			this.navHidden = navWidth === 0;
			if (this.$refs.contents == null) return;
			const width = this.$refs.contents.offsetWidth;
			this.$refs.header.style.width = `${width}px`;
		},

		showNav() {
			this.$refs.nav.show();
		},

		attachSticky(el) {
			const sticky = new StickySidebar(el, this.$refs.widgetsSpacer);
			window.addEventListener('scroll', () => {
				sticky.calc(window.scrollY);
			}, { passive: true });
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		help() {
			this.$router.push('/docs/keyboard-shortcut');
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		onHeaderClick() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		onContextmenu(e) {
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: faColumns,
				text: this.$t('openInSideView'),
				action: () => {
					this.$refs.side.navigate(path);
				}
			}, {
				icon: faWindowMaximize,
				text: this.$t('openInWindow'),
				action: () => {
					os.pageWindow(path);
				}
			}], e);
		},
	}
});
</script>

<style lang="scss" scoped>
.tray-enter-active,
.tray-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-enter-from,
.tray-leave-active {
	opacity: 0;
	transform: translateX(240px);
}

.tray-back-enter-active,
.tray-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.tray-back-enter-from,
.tray-back-leave-active {
	opacity: 0;
}

.mk-app {
	$header-height: 58px; // TODO: どこかに集約したい
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$widgets-hide-threshold: 1090px;

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;
	display: flex;

	&.wallpaper {
		background: var(--wallpaperOverlay);
		//backdrop-filter: blur(4px);
	}

	> .contents {
		width: 100%;
		min-width: 0;
		padding-top: $header-height;

		> .header {
			position: fixed;
			z-index: 1000;
			top: 0;
			height: $header-height;
			width: 100%;
			line-height: $header-height;
			text-align: center;
			font-weight: bold;
			//background-color: var(--panel);
			-webkit-backdrop-filter: blur(32px);
			backdrop-filter: blur(32px);
			background-color: var(--header);
			//border-bottom: solid 1px var(--divider);
			user-select: none;
		}

		> main {
			min-width: 0;

			> .content {
				> * {
					// ほんとは単に calc(100vh - #{$header-height}) と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
					min-height: calc((var(--vh, 1vh) * 100) - #{$header-height});
				}
			}

			> .spacer {
				height: 82px;

				@media (min-width: ($widgets-hide-threshold + 1px)) {
					display: none;
				}
			}
		}
	}

	> .side {
		min-width: 370px;
		max-width: 370px;
		border-left: solid 1px var(--divider);
	}

	> .widgets {
		padding: 0 var(--margin);
		border-left: solid 1px var(--divider);

		@media (max-width: $widgets-hide-threshold) {
			display: none;
		}
	}

	> .widgetButton {
		display: block;
		position: fixed;
		z-index: 1000;
		bottom: 32px;
		right: 32px;
		width: 64px;
		height: 64px;
		border-radius: 100%;
		box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
		font-size: 22px;
		background: var(--panel);

		&.navHidden {
			display: none;
		}

		@media (min-width: ($widgets-hide-threshold + 1px)) {
			display: none;
		}
	}

	> .buttons {
		position: fixed;
		z-index: 1000;
		bottom: 0;
		padding: 0 32px 32px 32px;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		background: linear-gradient(0deg, var(--bg), var(--X1));

		@media (max-width: 500px) {
			padding: 0 16px 16px 16px;
		}

		&:not(.navHidden) {
			display: none;
		}

		> .button {
			position: relative;
			padding: 0;
			margin: auto;
			width: 64px;
			height: 64px;
			border-radius: 100%;
			box-shadow: 0 3px 5px -1px rgba(0, 0, 0, 0.2), 0 6px 10px 0 rgba(0, 0, 0, 0.14), 0 1px 18px 0 rgba(0, 0, 0, 0.12);
			background: var(--panel);
			color: var(--fg);

			&:hover {
				background: var(--X2);
			}

			> i {
				position: absolute;
				top: 0;
				left: 0;
				color: var(--indicator);
				font-size: 16px;
				animation: blink 1s infinite;
			}

			&:first-child {
				margin-left: 0;
			}

			&:last-child {
				margin-right: 0;
			}

			> * {
				font-size: 22px;
			}

			&:disabled {
				cursor: default;

				> * {
					opacity: 0.5;
				}
			}
		}
	}

	> .tray-back {
		z-index: 1001;
	}

	> .tray {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		padding: var(--margin);
		box-sizing: border-box;
		overflow: auto;
		background: var(--bg);
	}
}
</style>

<style lang="scss">
</style>
