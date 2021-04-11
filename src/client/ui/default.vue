<template>
<div class="mk-app" :class="{ wallpaper, isMobile }">
	<div class="columns">
		<div class="sidebar" ref="sidebar" v-if="!isMobile">
			<XSidebar/>
		</div>

		<main class="main _panel" @contextmenu.stop="onContextmenu">
			<header v-if="$store.state.titlebar" class="header" @click="onHeaderClick">
				<XHeader :info="pageInfo"/>
			</header>
			<div class="content _flat_">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['timeline']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
		</main>

		<div v-if="isDesktop" class="widgets" ref="widgets">
			<XWidgets @mounted="attachSticky"/>
		</div>
	</div>

	<div class="buttons" v-if="isMobile">
		<button class="button nav _button" @click="showDrawerNav" ref="navButton"><Fa :icon="faBars"/><i v-if="navIndicated"><Fa :icon="faCircle"/></i></button>
		<button class="button home _button" @click="$route.name === 'index' ? top() : $router.push('/')"><Fa :icon="faHome"/></button>
		<button class="button notifications _button" @click="$router.push('/my/notifications')"><Fa :icon="faBell"/><i v-if="$i.hasUnreadNotification"><Fa :icon="faCircle"/></i></button>
		<button class="button widget _button" @click="widgetsShowing = true"><Fa :icon="faLayerGroup"/></button>
		<button class="button post _button" @click="post"><Fa :icon="faPencilAlt"/></button>
	</div>

	<XDrawerSidebar ref="drawerNav" class="sidebar" v-if="isMobile"/>

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
import { defineComponent, defineAsyncComponent } from 'vue';
import { faLayerGroup, faBars, faHome, faCircle, faWindowMaximize, faColumns, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import { faBell } from '@fortawesome/free-regular-svg-icons';
import { instanceName } from '@client/config';
import { StickySidebar } from '@client/scripts/sticky-sidebar';
import XSidebar from './default.sidebar.vue';
import XDrawerSidebar from '@client/ui/_common_/sidebar.vue';
import XCommon from './_common_/common.vue';
import XHeader from './_common_/header.vue';
import * as os from '@client/os';
import { sidebarDef } from '@client/sidebar';
import * as symbols from '@client/symbols';

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 600;

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XDrawerSidebar,
		XHeader,
		XWidgets: defineAsyncComponent(() => import('./default.widgets.vue')),
	},

	data() {
		return {
			pageInfo: null,
			menuDef: sidebarDef,
			isMobile: window.innerWidth <= MOBILE_THRESHOLD,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			widgetsShowing: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
			faLayerGroup, faBars, faBell, faHome, faCircle, faPencilAlt,
		};
	},

	computed: {
		navIndicated(): boolean {
			for (const def in this.menuDef) {
				if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		}
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';

		if (this.$store.state.widgets.length === 0) {
			this.$store.set('widgets', [{
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
		window.addEventListener('resize', () => {
			this.isMobile = (window.innerWidth <= MOBILE_THRESHOLD);
			this.isDesktop = (window.innerWidth >= DESKTOP_THRESHOLD);
		}, { passive: true });
	},

	methods: {
		changePage(page) {
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
				document.title = `${this.pageInfo.title} | ${instanceName}`;
			}
		},

		attachSticky() {
			const sticky = new StickySidebar(this.$refs.widgets, 16);
			window.addEventListener('scroll', () => {
				sticky.calc(window.scrollY);
			}, { passive: true });
		},

		post() {
			os.post();
		},

		top() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		showDrawerNav() {
			this.$refs.drawerNav.show();
		},

		onTransition() {
			if (window._scroll) window._scroll();
		},

		onHeaderClick() {
			window.scroll({ top: 0, behavior: 'smooth' });
		},

		onContextmenu(e) {
			const isLink = (el: HTMLElement) => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
			};
			if (isLink(e.target)) return;
			if (['INPUT', 'TEXTAREA'].includes(e.target.tagName) || e.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: faWindowMaximize,
				text: this.$ts.openInWindow,
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
	$header-height: 50px;
	$ui-font-size: 1em;
	$widgets-hide-threshold: 1200px;
	$nav-icon-only-width: 78px; // TODO: どこかに集約したい

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;

	&.wallpaper {
		background: var(--wallpaperOverlay);
		//backdrop-filter: blur(4px);
	}

	&.isMobile {
		> .columns {
			display: block;
			margin: 0;

			> .main {
				margin: 0;
				padding-bottom: 92px;
				border: none;
				width: 100%;
				border-radius: 0;

				> .header {
					width: 100%;
				}
			}
		}
	}

	> .columns {
		display: flex;
		justify-content: center;
		max-width: 100%;
		margin: 32px 0;

		> .main {
			width: 750px;
			margin: 0 16px 0 0;
			background: var(--bg);
			--margin: 12px;

			> .header {
				position: sticky;
				z-index: 1000;
				top: 0;
				height: $header-height;
				line-height: $header-height;
				-webkit-backdrop-filter: blur(32px);
				backdrop-filter: blur(32px);
				background-color: var(--header);
				border-bottom: solid 0.5px var(--divider);
			}

			> .content {
				background: var(--bg);
				--stickyTop: #{$header-height};
			}

			@media (max-width: 850px) {
				padding-top: $header-height;

				> .header {
					position: fixed;
					width: calc(100% - #{$nav-icon-only-width});
				}
			}
		}

		> .widgets {
			//--panelShadow: none;

			@media (max-width: $widgets-hide-threshold) {
				display: none;
			}
		}

		@media (max-width: 850px) {
			margin: 0;

			> .sidebar {
				border-right: solid 0.5px var(--divider);
			}

			> .main {
				margin: 0;
				border-radius: 0;
				box-shadow: none;
				width: 100%;
			}
		}
	}

	> .buttons {
		position: fixed;
		z-index: 1000;
		bottom: 0;
		padding: 16px;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		-webkit-backdrop-filter: blur(32px);
		backdrop-filter: blur(32px);
		background-color: var(--header);
		border-top: solid 0.5px var(--divider);

		> .button {
			position: relative;
			flex: 1;
			padding: 0;
			margin: auto;
			height: 64px;
			border-radius: 8px;
			background: var(--panel);
			color: var(--fg);

			&:not(:last-child) {
				margin-right: 12px;
			}

			@media (max-width: 400px) {
				height: 60px;

				&:not(:last-child) {
					margin-right: 8px;
				}
			}

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
