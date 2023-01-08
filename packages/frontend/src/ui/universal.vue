<template>
<div class="dkgtipfy" :class="{ wallpaper }">
	<XSidebar v-if="!isMobile" class="sidebar"/>

	<MkStickyContainer class="contents">
		<template #header><XStatusBars :class="$style.statusbars"/></template>
		<main style="min-width: 0;" :style="{ background: pageMetadata?.value?.bg }" @contextmenu.stop="onContextmenu">
			<div :class="$style.content" style="container-type: inline-size;">
				<RouterView/>
			</div>
			<div :class="$style.spacer"></div>
		</main>
	</MkStickyContainer>

	<div v-if="isDesktop" ref="widgetsEl" class="widgets">
		<XWidgets @mounted="attachSticky"/>
	</div>

	<button v-if="!isDesktop && !isMobile" class="widgetButton _button" @click="widgetsShowing = true"><i class="ti ti-apps"></i></button>

	<div v-if="isMobile" class="buttons">
		<button class="button nav _button" @click="drawerMenuShowing = true"><i class="icon ti ti-menu-2"></i><span v-if="menuIndicated" class="indicator"><i class="_indicatorCircle"></i></span></button>
		<button class="button home _button" @click="mainRouter.currentRoute.value.name === 'index' ? top() : mainRouter.push('/')"><i class="icon ti ti-home"></i></button>
		<button class="button notifications _button" @click="mainRouter.push('/my/notifications')"><i class="icon ti ti-bell"></i><span v-if="$i?.hasUnreadNotification" class="indicator"><i class="_indicatorCircle"></i></span></button>
		<button class="button widget _button" @click="widgetsShowing = true"><i class="icon ti ti-apps"></i></button>
		<button class="button post _button" @click="os.post()"><i class="icon ti ti-pencil"></i></button>
	</div>

	<Transition :name="$store.state.animation ? 'menuDrawer-back' : ''">
		<div
			v-if="drawerMenuShowing"
			class="menuDrawer-back _modalBg"
			@click="drawerMenuShowing = false"
			@touchstart.passive="drawerMenuShowing = false"
		></div>
	</Transition>

	<Transition :name="$store.state.animation ? 'menuDrawer' : ''">
		<XDrawerMenu v-if="drawerMenuShowing" class="menuDrawer"/>
	</Transition>

	<Transition :name="$store.state.animation ? 'widgetsDrawer-back' : ''">
		<div
			v-if="widgetsShowing"
			class="widgetsDrawer-back _modalBg"
			@click="widgetsShowing = false"
			@touchstart.passive="widgetsShowing = false"
		></div>
	</Transition>

	<Transition :name="$store.state.animation ? 'widgetsDrawer' : ''">
		<XWidgets v-if="widgetsShowing" class="widgetsDrawer"/>
	</Transition>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, provide, onMounted, computed, ref, watch, ComputedRef } from 'vue';
import XCommon from './_common_/common.vue';
import { instanceName } from '@/config';
import { StickySidebar } from '@/scripts/sticky-sidebar';
import XDrawerMenu from '@/ui/_common_/navbar-for-mobile.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';
import { navbarItemDef } from '@/navbar';
import { i18n } from '@/i18n';
import { $i } from '@/account';
import { Router } from '@/nirax';
import { mainRouter } from '@/router';
import { PageMetadata, provideMetadataReceiver, setPageMetadata } from '@/scripts/page-metadata';
import { deviceKind } from '@/scripts/device-kind';
import { miLocalStorage } from '@/local-storage';
const XWidgets = defineAsyncComponent(() => import('./universal.widgets.vue'));
const XSidebar = defineAsyncComponent(() => import('@/ui/_common_/navbar.vue'));
const XStatusBars = defineAsyncComponent(() => import('@/ui/_common_/statusbars.vue'));

const DESKTOP_THRESHOLD = 1100;
const MOBILE_THRESHOLD = 500;

// デスクトップでウィンドウを狭くしたときモバイルUIが表示されて欲しいことはあるので deviceKind === 'desktop' の判定は行わない
const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
const isMobile = ref(deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD);
window.addEventListener('resize', () => {
	isMobile.value = deviceKind === 'smartphone' || window.innerWidth <= MOBILE_THRESHOLD;
});

let pageMetadata = $ref<null | ComputedRef<PageMetadata>>();
const widgetsEl = $shallowRef<HTMLElement>();
const widgetsShowing = $ref(false);

provide('router', mainRouter);
provideMetadataReceiver((info) => {
	pageMetadata = info;
	if (pageMetadata.value) {
		document.title = `${pageMetadata.value.title} | ${instanceName}`;
	}
});

const menuIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (def === 'notifications') continue; // 通知は下にボタンとして表示されてるから
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

const drawerMenuShowing = ref(false);

mainRouter.on('change', () => {
	drawerMenuShowing.value = false;
});

document.documentElement.style.overflowY = 'scroll';

defaultStore.ready.then(() => {
	if (defaultStore.state.widgets.length === 0) {
		defaultStore.set('widgets', [{
			name: 'calendar',
			id: 'a', place: 'right', data: {},
		}, {
			name: 'notifications',
			id: 'b', place: 'right', data: {},
		}, {
			name: 'trends',
			id: 'c', place: 'right', data: {},
		}]);
	}
});

onMounted(() => {
	if (!isDesktop.value) {
		window.addEventListener('resize', () => {
			if (window.innerWidth >= DESKTOP_THRESHOLD) isDesktop.value = true;
		}, { passive: true });
	}
});

const onContextmenu = (ev) => {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(ev.target.tagName) || ev.target.attributes['contenteditable']) return;
	if (window.getSelection()?.toString() !== '') return;
	const path = mainRouter.getCurrentPath();
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
};

const attachSticky = (el) => {
	const sticky = new StickySidebar(widgetsEl);
	window.addEventListener('scroll', () => {
		sticky.calc(window.scrollY);
	}, { passive: true });
};

function top() {
	window.scroll({ top: 0, behavior: 'smooth' });
}

const wallpaper = miLocalStorage.getItem('wallpaper') != null;
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

	min-height: 100dvh;
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
		background: var(--bg);
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
	}

	> .widgetsDrawer-back {
		z-index: 1001;
	}

	> .widgetsDrawer {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		height: 100dvh;
		padding: var(--margin) !important;
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
		padding: 12px 12px max(12px, env(safe-area-inset-bottom, 0px)) 12px;
		display: grid;
		grid-template-columns: 1fr 1fr 1fr 1fr 1fr;
		grid-gap: 8px;
		width: 100%;
		box-sizing: border-box;
		-webkit-backdrop-filter: var(--blur, blur(32px));
		backdrop-filter: var(--blur, blur(32px));
		background-color: var(--header);
		border-top: solid 0.5px var(--divider);

		> .button {
			position: relative;
			padding: 0;
			aspect-ratio: 1;
			width: 100%;
			max-width: 60px;
			margin: auto;
			border-radius: 100%;
			background: var(--panel);
			color: var(--fg);

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

			> .icon {
				font-size: 18px;
			}

			&:disabled {
				cursor: default;

				> .icon {
					opacity: 0.5;
				}
			}

			&.post {
				background: linear-gradient(90deg, var(--buttonGradateA), var(--buttonGradateB));
				color: var(--fgOnAccent);
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
		height: 100dvh;
		width: 240px;
		box-sizing: border-box;
		contain: strict;
		overflow: auto;
		overscroll-behavior: contain;
		background: var(--navBg);
	}
}
</style>

<style lang="scss" module>
.statusbars {
	position: sticky;
	top: 0;
	left: 0;
}

.spacer {
	$widgets-hide-threshold: 1090px;

	height: calc(env(safe-area-inset-bottom, 0px) + 96px);

	@media (min-width: ($widgets-hide-threshold + 1px)) {
		display: none;
	}
}
</style>
