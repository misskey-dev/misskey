<template>
<div class="mk-app" :class="{ wallpaper, isMobile }">
	<div class="columns">
		<XSidebar class="sidebar" v-if="!isMobile"/>

		<main class="main _panel" @contextmenu.stop="onContextmenu">
			<header v-if="$store.state.titlebar && $route.name !== 'index'" class="header" @click="onHeaderClick">
				<XHeader :info="pageInfo"/>
			</header>
			<div class="content _fit_">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['timeline']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
		</main>

		<XSide class="side" ref="side"/>

		<div v-if="isDesktop" class="widgets">
			<div ref="widgetsSpacer"></div>
			<XWidgets @mounted="attachSticky"/>
		</div>
	</div>

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
import XCommon from './_common_/common.vue';
import XHeader from './_common_/header.vue';
import XSide from './default.side.vue';
import * as os from '@client/os';
import { sidebarDef } from '@client/sidebar';

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 600;

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
			sideViewHook: (url) => {
				this.$refs.side.navigate(url);
			}
		};
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
			if (page.INFO) {
				this.pageInfo = page.INFO;
				document.title = `${this.pageInfo.title} | ${instanceName}`;
			}
		},

		attachSticky(el) {
			const sticky = new StickySidebar(el, this.$refs.widgetsSpacer, 16, 16);
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
				icon: faColumns,
				text: this.$ts.openInSideView,
				action: () => {
					this.$refs.side.navigate(path);
				}
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
.mk-app {
	$header-height: 58px; // TODO: どこかに集約したい
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$widgets-hide-threshold: 1200px;

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
				border: none;
				width: 100%;
				border-radius: 0;
			}
		}
	}

	> .columns {
		display: flex;
		justify-content: center;
		max-width: 100%;
		margin: 32px 0;
		--panelShadow: none;

		> .sidebar {
			width: 220px;
		}

		> .main {
			width: 750px;
			margin: 0 16px;
			border: solid 1px var(--divider);
			--section-padding: 0;
			--baseContentWidth: 100%;
			--margin: 10px;

			> .header {
				position: sticky;
				z-index: 1000;
				top: 0;
				height: 50px;
				line-height: 50px;
				-webkit-backdrop-filter: blur(32px);
				backdrop-filter: blur(32px);
				background-color: var(--header);
				border-bottom: solid 1px var(--divider);
			}

			> .content {
				background: var(--bg);
			}
		}

		> .widgets {
			::v-deep(._panel.widget),
			::v-deep(._block.widget) {
				border: solid 1px var(--divider);
			}

			@media (max-width: $widgets-hide-threshold) {
				display: none;
			}
		}
	}
}
</style>
