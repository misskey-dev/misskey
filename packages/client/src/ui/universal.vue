<template>
<div class="dkgtipfy" :class="{ wallpaper }">
	<XSidebar v-if="!isMobile" class="sidebar"/>

	<div class="contents" :style="{ background: pageInfo?.bg }" @contextmenu.stop="onContextmenu">
		<main>
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

	<XSideView v-if="isDesktop" ref="side" class="side"/>

	<div v-if="isDesktop" ref="widgetsEl" class="widgets">
		<XWidgets @mounted="attachSticky"/>
	</div>

	<button class="widgetButton _button" :class="{ show: true }" @click="widgetsShowing = true"><i class="fas fa-layer-group"></i></button>

	<div v-if="isMobile" class="buttons">
		<button class="button nav _button" @click="drawerMenuShowing = true"><i class="fas fa-bars"></i><span v-if="menuIndicated" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button home _button" @click="$route.name === 'index' ? top() : $router.push('/')"><i class="fas fa-home"></i></button>
		<button class="button notifications _button" @click="$router.push('/my/notifications')"><i class="fas fa-bell"></i><span v-if="$i.hasUnreadNotification" class="indicator"><i class="fas fa-circle"></i></span></button>
		<button class="button widget _button" @click="widgetsShowing = true"><i class="fas fa-layer-group"></i></button>
		<button class="button post _button" @click="post()"><i class="fas fa-pencil-alt"></i></button>
	</div>

	<transition name="menuDrawer-back">
		<div v-if="drawerMenuShowing"
			class="menuDrawer-back _modalBg"
			@click="drawerMenuShowing = false"
			@touchstart.passive="drawerMenuShowing = false"
		></div>
	</transition>

	<transition name="menuDrawer">
		<XDrawerMenu v-if="drawerMenuShowing" class="menuDrawer"/>
	</transition>

	<transition name="widgetsDrawer-back">
		<div v-if="widgetsShowing"
			class="widgetsDrawer-back _modalBg"
			@click="widgetsShowing = false"
			@touchstart.passive="widgetsShowing = false"
		></div>
	</transition>

	<transition name="widgetsDrawer">
		<XWidgets v-if="widgetsShowing" class="widgetsDrawer"/>
	</transition>

	<XCommon/>
</div>
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent, provide, onMounted, computed, ref, watch } from 'vue';
import { instanceName } from '@/config';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import XSidebar from '@/ui/_common_/sidebar.vue';
import XDrawerMenu from '@/ui/_common_/sidebar-for-mobile.vue';
import XCommon from './_common_/common.vue';
import XSideView from './classic.side.vue';
import * as os from '@/os';
import * as symbols from '@/symbols';
import { defaultStore } from '@/store';
import * as EventEmitter from 'eventemitter3';
import { menuDef } from '@/menu';
import { useRoute } from 'vue-router';
import { i18n } from '@/i18n';

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 500;

export default defineComponent({
	components: {
		XCommon,
		XSidebar,
		XDrawerMenu,
		XWidgets: defineAsyncComponent(() => import('./universal.widgets.vue')),
		XSideView, // NOTE: dynamic importするとAsyncComponentWrapperが間に入るせいでref取得できなくて面倒になる
	},

	setup() {
		const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
		const isMobile = ref(window.innerWidth <= MOBILE_THRESHOLD);
		window.addEventListener('resize', () => {
			isMobile.value = window.innerWidth <= MOBILE_THRESHOLD;
		});

		const pageInfo = ref();
		const widgetsEl = ref<HTMLElement>();
		const widgetsShowing = ref(false);

		const sideViewController = new EventEmitter();

		provide('sideViewHook', isDesktop.value ? (url) => {
			sideViewController.emit('navigate', url);
		} : null);

		const menuIndicated = computed(() => {
			for (const def in menuDef) {
				if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
				if (menuDef[def].indicated) return true;
			}
			return false;
		});

		const drawerMenuShowing = ref(false);

		const route = useRoute();
		watch(route, () => {
			drawerMenuShowing.value = false;
		});

		document.documentElement.style.overflowY = 'scroll';

		if (defaultStore.state.widgets.length === 0) {
			defaultStore.set('widgets', [{
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

		onMounted(() => {
			if (!isDesktop.value) {
				window.addEventListener('resize', () => {
					if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop.value = true;
				}, { passive: true });
			}
		});

		const changePage = (page) => {
			if (page == null) return;
			if (page[symbols.PAGE_INFO]) {
				pageInfo.value = page[symbols.PAGE_INFO];
				document.title = `${pageInfo.value.title} | ${instanceName}`;
			}
		};

		const onContextmenu = (ev) => {
			const isLink = (el: HTMLElement) => {
				if (el.tagName === 'A') return true;
				if (el.parentElement) {
					return isLink(el.parentElement);
				}
			};
			if (isLink(ev.target)) return;
			if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(ev.target.tagName) || ev.target.attributes['contenteditable']) return;
			if (window.getSelection().toString() !== '') return;
			const path = route.path;
			os.contextMenu([{
				type: 'label',
				text: path,
			}, {
				icon: 'fas fa-columns',
				text: i18n.locale.openInSideView,
				action: () => {
					this.$refs.side.navigate(path);
				}
			}, {
				icon: 'fas fa-window-maximize',
				text: i18n.locale.openInWindow,
				action: () => {
					os.pageWindow(path);
				}
			}], ev);
		};

		const attachSticky = (el) => {
			const sticky = new StickySidebar(widgetsEl.value);
			window.addEventListener('scroll', () => {
				sticky.calc(window.scrollY);
			}, { passive: true });
		};

		return {
			pageInfo,
			isDesktop,
			isMobile,
			widgetsEl,
			widgetsShowing,
			drawerMenuShowing,
			menuIndicated,
			wallpaper: localStorage.getItem('wallpaper') != null,
			changePage,
			top: () => {
				window.scroll({ top: 0, behavior: 'smooth' });
			},
			onTransition: () => {
				if (window._scroll) window._scroll();
			},
			post: os.post,
			onContextmenu,
			attachSticky,
		};
	},
});
</script>

<style lang="scss" scoped>
.widgetsDrawer-enter-active,
.widgetsDrawer-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.widgetsDrawer-enter-from,
.widgetsDrawer-leave-active {
	opacity: 0;
	transform: translateX(240px);
}

.widgetsDrawer-back-enter-active,
.widgetsDrawer-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.widgetsDrawer-back-enter-from,
.widgetsDrawer-back-leave-active {
	opacity: 0;
}

.menuDrawer-enter-active,
.menuDrawer-leave-active {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.menuDrawer-enter-from,
.menuDrawer-leave-active {
	opacity: 0;
	transform: translateX(-240px);
}

.menuDrawer-back-enter-active,
.menuDrawer-back-leave-active {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.menuDrawer-back-enter-from,
.menuDrawer-back-leave-active {
	opacity: 0;
}

.dkgtipfy {
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
		border-right: solid 0.5px var(--divider);
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

/*
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
	}*/

	> .widgetButton {
		display: none;
	}

	> .widgetsDrawer-back {
		z-index: 1001;
	}

	> .widgetsDrawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		padding: var(--margin);
		box-sizing: border-box;
		overflow: auto;
		overscroll-behavior: contain;
		background: var(--bg);
	}

	> .buttons {
		position: fixed;
		z-index: 1000;
		bottom: 0;
		left: 0;
		padding: 16px;
		display: flex;
		width: 100%;
		box-sizing: border-box;
		-webkit-backdrop-filter: var(--blur, blur(32px));
		backdrop-filter: var(--blur, blur(32px));
		background-color: var(--header);

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

	> .menuDrawer-back {
		z-index: 1001;
	}

	> .menuDrawer {
		position: fixed;
		top: 0;
		left: 0;
		z-index: 1001;
		// ほんとは単に 100vh と書きたいところだが... https://css-tricks.com/the-trick-to-viewport-units-on-mobile/
		height: calc(var(--vh, 1vh) * 100);
		width: 240px;
		box-sizing: border-box;
		overflow: auto;
		overscroll-behavior: contain;
		background: var(--bg);
	}

}
</style>

<style lang="scss">
</style>
