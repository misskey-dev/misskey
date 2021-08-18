<template>
<div class="mk-app" :class="{ wallpaper, isMobile }">
	<XHeaderMenu v-if="showMenuOnTop"/>

	<div class="columns" :class="{ fullView, withGlobalHeader: showMenuOnTop }">
		<template v-if="!isMobile">
			<div class="sidebar" v-if="!showMenuOnTop">
				<XSidebar/>
			</div>
			<div class="widgets left" ref="widgetsLeft" v-else>
				<XWidgets @mounted="attachSticky('widgetsLeft')" :place="'left'"/>
			</div>
		</template>

		<main class="main" @contextmenu.stop="onContextmenu">
			<header class="header" @click="onHeaderClick">
				<XHeader :info="pageInfo" :back-button="true" @back="back()"/>
			</header>
			<div class="content" :class="{ _flat_: !fullView }">
				<router-view v-slot="{ Component }">
					<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
						<keep-alive :include="['timeline']">
							<component :is="Component" :ref="changePage"/>
						</keep-alive>
					</transition>
				</router-view>
			</div>
		</main>

		<div v-if="isDesktop" class="widgets right" ref="widgetsRight">
			<XWidgets @mounted="attachSticky('widgetsRight')" :place="null"/>
		</div>
	</div>

	<div class="buttons" v-if="isMobile">
		<button class="button nav _button" @click="showDrawerNav" ref="navButton"><i class="fas fa-bars"></i><span v-if="navIndicated" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button home _button" @click="$route.name === 'index' ? top() : $router.push('/')"><i class="fas fa-home"></i></button>
		<button class="button notifications _button" @click="$router.push('/my/notifications')"><i class="fas fa-bell"></i><span v-if="$i.hasUnreadNotification" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button widget _button" @click="widgetsShowing = true"><i class="fas fa-layer-group"></i></button>
		<button class="button post _button" @click="post"><i class="fas fa-pencil-alt"></i></button>
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
import { instanceName } from '@client/config';
import { StickySidebar } from '@client/scripts/sticky-sidebar';
import XSidebar from './default.sidebar.vue';
import XDrawerSidebar from '@client/ui/_common_/sidebar.vue';
import XCommon from './_common_/common.vue';
import XHeader from './_common_/header.vue';
import * as os from '@client/os';
import { menuDef } from '@client/menu';
import * as symbols from '@client/symbols';

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 600;

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XDrawerSidebar,
		XHeader,
		XHeaderMenu: defineAsyncComponent(() => import('./default.header.vue')),
		XWidgets: defineAsyncComponent(() => import('./default.widgets.vue')),
	},

	data() {
		return {
			pageInfo: null,
			menuDef: menuDef,
			isMobile: window.innerWidth <= MOBILE_THRESHOLD,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			widgetsShowing: false,
			fullView: false,
			wallpaper: localStorage.getItem('wallpaper') != null,
		};
	},

	computed: {
		navIndicated(): boolean {
			for (const def in this.menuDef) {
				if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
				if (this.menuDef[def].indicated) return true;
			}
			return false;
		},

		showMenuOnTop(): boolean {
			return !this.isMobile && this.$store.state.menuDisplay === 'top';
		}
	},

	created() {
		document.documentElement.style.overflowY = 'scroll';

		if (this.$store.state.widgets.length === 0) {
			this.$store.set('widgets', [{
				name: 'calendar',
				id: 'a', place: null, data: {}
			}, {
				name: 'notifications',
				id: 'b', place: null, data: {}
			}, {
				name: 'trends',
				id: 'c', place: null, data: {}
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

		attachSticky(ref) {
			const sticky = new StickySidebar(this.$refs[ref], this.$store.state.menuDisplay === 'top' ? 0 : 16, this.$store.state.menuDisplay === 'top' ? 60 : 0); // TODO: ヘッダーの高さを60pxと決め打ちしているのを直す
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

		back() {
			history.back();
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
			if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(e.target.tagName) || e.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = this.$route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: this.fullView ? 'fas fa-compress' : 'fas fa-expand',
				text: this.fullView ? this.$ts.quitFullView : this.$ts.fullView,
				action: () => {
					this.fullView = !this.fullView;
				}
			}, {
				icon: 'fas fa-window-maximize',
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
		//backdrop-filter: var(--blur, blur(4px));
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
		//margin: 32px 0;

		&.fullView {
			margin: 0;
		
			> .sidebar {
				display: none;
			}

			> .widgets {
				display: none;
			}

			> .main {
				margin: 0;
				border-radius: 0;
				box-shadow: none;
				width: 100%;
			}
		}

		> .main {
			min-width: 0;
			width: 750px;
			margin: 0 16px 0 0;
			background: var(--panel);
			border-left: solid 1px var(--divider);
			border-right: solid 1px var(--divider);
			border-radius: 0;
			overflow: clip;
			--margin: 12px;

			> .header {
				position: sticky;
				z-index: 1000;
				top: var(--globalHeaderHeight, 0px);
				height: $header-height;
				-webkit-backdrop-filter: var(--blur, blur(32px));
				backdrop-filter: var(--blur, blur(32px));
				background-color: var(--header);
				border-bottom: solid 0.5px var(--divider);
			}

			> .content {
				--stickyTop: calc(var(--globalHeaderHeight, 0px) + #{$header-height});
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
			//--panelBorder: none;
			width: 300px;
			margin-top: 16px;

			@media (max-width: $widgets-hide-threshold) {
				display: none;
			}

			&.left {
				margin-right: 16px;
			}
		}

		> .sidebar {
			margin-top: 16px;
		}

		&.withGlobalHeader {
			--globalHeaderHeight: 60px; // TODO: 60pxと決め打ちしているのを直す

			> .main {
				margin-top: 0;
				border: solid 1px var(--divider);
				border-radius: var(--radius);
			}

			> .widgets {
				--stickyTop: var(--globalHeaderHeight);
				margin-top: 0;
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
		-webkit-backdrop-filter: var(--blur, blur(32px));
		backdrop-filter: var(--blur, blur(32px));
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

			> .indicator {
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
