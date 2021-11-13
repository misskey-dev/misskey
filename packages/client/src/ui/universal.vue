<template>
<div class="mk-app" :class="{ wallpaper }">
	<XSidebar ref="nav" class="sidebar"/>

	<div class="contents" ref="contents" @contextmenu.stop="onContextmenu" :style="{ background: pageInfo?.bg }">
		<main ref="main">
			<div class="content">
				<MkStickyContainer>
					<template #header><MkHeader v-if="pageInfo && !pageInfo.hideHeader" :info="pageInfo"/></template>
					<router-view v-slot="{ Component }">
						<transition :name="$store.state.animation ? 'page' : ''" mode="out-in" @enter="onTransition">
							<keep-alive :include="['timeline']">
								<component :is="Component" :ref="changePage"/>
							</keep-alive>
						</transition>
					</router-view>
				</MkStickyContainer>
			</div>
			<div class="spacer"></div>
		</main>
	</div>

	<XSide v-if="isDesktop" class="side" ref="side"/>

	<div v-if="isDesktop" class="widgets" ref="widgets">
		<XWidgets @mounted="attachSticky"/>
	</div>

	<div class="buttons" :class="{ navHidden }">
		<button class="button nav _button" @click="showNav" ref="navButton"><i class="fas fa-bars"></i><span v-if="navIndicated" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button home _button" @click="$route.name === 'index' ? top() : $router.push('/')"><i class="fas fa-home"></i></button>
		<button class="button notifications _button" @click="$router.push('/my/notifications')"><i class="fas fa-bell"></i><span v-if="$i.hasUnreadNotification" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button widget _button" @click="widgetsShowing = true"><i class="fas fa-layer-group"></i></button>
		<button class="button post _button" @click="post"><i class="fas fa-pencil-alt"></i></button>
	</div>

	<button class="widgetButton _button" :class="{ navHidden }" @click="widgetsShowing = true"><i class="fas fa-layer-group"></i></button>

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
import { instanceName } from '@/config';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import XSidebar from '@/ui/_common_/sidebar.vue';
import XCommon from './_common_/common.vue';
import XSide from './classic.side.vue';
import * as os from '@/os';
import { menuDef } from '@/menu';
import * as symbols from '@/symbols';

const DESKTOP_THRESHOLD = 1100;

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XWidgets: defineAsyncComponent(() => import('./universal.widgets.vue')),
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
			pageInfo: null,
			isDesktop: window.innerWidth >= DESKTOP_THRESHOLD,
			menuDef: menuDef,
			navHidden: false,
			widgetsShowing: false,
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
			if (page[symbols.PAGE_INFO]) {
				this.pageInfo = page[symbols.PAGE_INFO];
				document.title = `${this.pageInfo.title} | ${instanceName}`;
			}
		},

		adjustUI() {
			const navWidth = this.$refs.nav.$el.offsetWidth;
			this.navHidden = navWidth === 0;
		},

		showNav() {
			this.$refs.nav.show();
		},

		attachSticky(el) {
			const sticky = new StickySidebar(this.$refs.widgets);
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

		onTransition() {
			if (window._scroll) window._scroll();
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
				icon: 'fas fa-columns',
				text: this.$ts.openInSideView,
				action: () => {
					this.$refs.side.navigate(path);
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
	$ui-font-size: 1em; // TODO: どこかに集約したい
	$widgets-hide-threshold: 1090px;

	// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
	min-height: calc(var(--vh, 1vh) * 100);
	box-sizing: border-box;
	display: flex;

	&.wallpaper {
		background: var(--wallpaperOverlay);
		//backdrop-filter: var(--blur, blur(4px));
	}

	> .sidebar {
	}

	> .contents {
		width: 100%;
		min-width: 0;
		background: var(--panel);

		> main {
			min-width: 0;

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
		border-left: solid 0.5px var(--divider);
	}

	> .widgets {
		padding: 0 var(--margin);
		border-left: solid 0.5px var(--divider);
		background: var(--bg);

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
		padding: 16px;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		-webkit-backdrop-filter: var(--blur, blur(32px));
		backdrop-filter: var(--blur, blur(32px));
		background-color: var(--header);

		&:not(.navHidden) {
			display: none;
		}

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

<style lang="scss">
</style>
