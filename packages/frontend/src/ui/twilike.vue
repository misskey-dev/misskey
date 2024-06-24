<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root,{ wallpaper }]" :style="`--globalHeaderHeight:${globalHeaderHeight}px`">
	<XHeaderMenu v-if="showMenuOnTop" v-get-size="(w, h) => globalHeaderHeight = h"/>

	<div :class="[$style.columns,{ [$style.fullView]:fullView, [$style.withGlobalHeader]: showMenuOnTop }]">
		<div v-if="!showMenuOnTop && isDesktop" :class="$style.sidebar">
			<XSidebar/>
		</div>
		<div v-else-if="!pageMetadata?.needWideArea && isDesktop" ref="widgetsLeft" :class="[$style.widgets,$style.left]">
			<XWidgets place="left" :marginTop="'var(--margin)'"/>
		</div>

		<main :class="[$style.main, {[$style.wide]: pageMetadata?.needWideArea} ]" @contextmenu.stop="onContextmenu">
			<RouterView/>
		</main>

		<div v-if="isDesktop && !pageMetadata?.needWideArea" ref="widgetsRight" :class="$style.widgets">
			<XWidgets :place="showMenuOnTop ? 'right' : null" :marginTop="showMenuOnTop ? '0' : 'var(--margin)'"/>
		</div>
	</div>

	<Transition :name="defaultStore.state.animation ? 'tray-back' : ''">
		<div
			v-if="widgetsShowing"
			class="tray-back _modalBg"
			@click="widgetsShowing = false"
			@touchstart.passive="widgetsShowing = false"
		></div>
	</Transition>

	<XCommon/>
	<div v-if="!isDesktop" ref="navFooter" :class="$style.nav">
		<button :class="$style.navButton" class="_button" @click="drawerMenuShowing = true"><i :class="$style.navButtonIcon" class="ti ti-menu-2"></i><span v-if="menuIndicated" :class="$style.navButtonIndicator"><i class="_indicatorCircle"></i></span></button>
		<button :class="$style.navButton" class="_button" @click="isRoot ? top() : mainRouter.push('/')"><i :class="$style.navButtonIcon" class="ti ti-home"></i></button>
		<button :class="$style.navButton" class="_button" @click="mainRouter.push('/my/notifications')">
			<i :class="$style.navButtonIcon" class="ti ti-bell"></i>
			<span v-if="$i?.hasUnreadNotification" :class="$style.navButtonIndicator">
				<span class="_indicateCounter" :class="$style.itemIndicateValueIcon">{{ $i.unreadNotificationsCount > 99 ? '99+' : $i.unreadNotificationsCount }}</span>
			</span>
		</button>
		<button :class="$style.navButton" class="_button" @click="widgetsShowing = true"><i :class="$style.navButtonIcon" class="ti ti-apps"></i></button>
		<button :class="$style.navButton" class="_button" @click="os.post()"><i :class="$style.navButtonIcon" class="ti ti-pencil"></i></button>
	</div>
	<Transition
		:enterActiveClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_enterActive : ''"
		:leaveActiveClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_leaveActive : ''"
		:enterFromClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_enterFrom : ''"
		:leaveToClass="defaultStore.state.animation ? $style.transition_menuDrawerBg_leaveTo : ''"
	>
		<div
			v-if="drawerMenuShowing || widgetsShowing"
			:class="$style.menuDrawerBg"
			class="_modalBg"
			@click="drawerMenuShowing = false; widgetsShowing = false "
			@touchstart.passive="drawerMenuShowing = false; widgetsShowing = false"
		></div>
	</Transition>

	<Transition
		:enterActiveClass="defaultStore.state.animation ? $style.transition_menuDrawer_enterActive : ''"
		:leaveActiveClass="defaultStore.state.animation ? $style.transition_menuDrawer_leaveActive : ''"
		:enterFromClass="defaultStore.state.animation ? $style.transition_menuDrawer_enterFrom : ''"
		:leaveToClass="defaultStore.state.animation ? $style.transition_menuDrawer_leaveTo : ''"
	>
		<div v-if="drawerMenuShowing" :class="$style.menuDrawer">
			<XDrawerMenu/>
		</div>
	</Transition>
	<Transition
		:enterActiveClass="defaultStore.state.animation ? $style.transition_widgetsDrawer_enterActive : ''"
		:leaveActiveClass="defaultStore.state.animation ? $style.transition_widgetsDrawer_leaveActive : ''"
		:enterFromClass="defaultStore.state.animation ? $style.transition_widgetsDrawer_enterFrom : ''"
		:leaveToClass="defaultStore.state.animation ? $style.transition_widgetsDrawer_leaveTo : ''"
	>
		<div v-if="widgetsShowing" :class="$style.widgetsDrawer">
			<button class="_button" :class="$style.widgetsCloseButton" @click="widgetsShowing = false"><i class="ti ti-x"></i></button>
			<XWidgets/>
		</div>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, onMounted, provide, ref, computed, shallowRef, watch } from 'vue';
import XSidebar from './twilike.sidebar.vue';
import XCommon from './_common_/common.vue';
import { instanceName, ui } from '@/config.js';
import * as os from '@/os.js';
import { PageMetadata, provideMetadataReceiver, provideReactiveMetadata } from '@/scripts/page-metadata.js';
import { defaultStore } from '@/store.js';
import { i18n } from '@/i18n.js';
import { miLocalStorage } from '@/local-storage.js';
import { mainRouter } from '@/router/main.js';
import { $i } from '@/account.js';
import XDrawerMenu from '@/ui/_common_/navbar-for-mobile.vue';
const XHeaderMenu = defineAsyncComponent(() => import('./classic.header.vue'));
const XWidgets = defineAsyncComponent(() => import('./universal.widgets.vue'));

const isRoot = computed(() => mainRouter.currentRoute.value.name === 'index');

const DESKTOP_THRESHOLD = 700;

const isDesktop = ref(window.innerWidth >= DESKTOP_THRESHOLD);
const drawerMenuShowing = ref(false);
const pageMetadata = ref<null | PageMetadata>(null);
const widgetsShowing = ref(false);
const fullView = ref(false);
const globalHeaderHeight = ref(0);
const wallpaper = miLocalStorage.getItem('wallpaper') != null;
const showMenuOnTop = computed(() => defaultStore.state.menuDisplay === 'top');
const widgetsLeft = ref<HTMLElement>();
const widgetsRight = ref<HTMLElement>();

provide('router', mainRouter);
provideMetadataReceiver((metadataGetter) => {
	const info = metadataGetter();
	pageMetadata.value = info;
	if (mainRouter.currentRoute.value.path.split('/').slice(1)[0] === 'settings') {
		pageMetadata.value.needWideArea = true;
	}
	if (pageMetadata.value) {
		if (isRoot.value && pageMetadata.value.title === instanceName) {
			document.title = pageMetadata.value.title;
		} else {
			document.title = `${pageMetadata.value.title} | ${instanceName}`;
		}
	}
});
provideReactiveMetadata(pageMetadata);
provide('shouldHeaderThin', showMenuOnTop.value);
provide('forceSpacerMin', true);

function onContextmenu(ev: MouseEvent) {
	const isLink = (el: HTMLElement) => {
		if (el.tagName === 'A') return true;
		if (el.parentElement) {
			return isLink(el.parentElement);
		}
	};
	if (isLink(ev.target)) return;
	if (['INPUT', 'TEXTAREA', 'IMG', 'VIDEO', 'CANVAS'].includes(ev.target.tagName) || ev.target.attributes['contenteditable']) return;
	if (window.getSelection().toString() !== '') return;
	const path = mainRouter.getCurrentPath();
	os.contextMenu([{
		type: 'label',
		text: path,
	}, {
		icon: fullView.value ? 'ti ti-minimize' : 'ti ti-maximize',
		text: fullView.value ? i18n.ts.quitFullView : i18n.ts.fullView,
		action: () => {
			fullView.value = !fullView.value;
		},
	}, {
		icon: 'ti ti-window-maximize',
		text: i18n.ts.openInWindow,
		action: () => {
			os.pageWindow(path);
		},
	}], ev);
}

document.documentElement.style.overflowY = 'scroll';

defaultStore.loaded.then(() => {
	if (defaultStore.state.widgets.length === 0) {
		defaultStore.set('widgets', [{
			name: 'calendar',
			id: 'a', place: null, data: {},
		}, {
			name: 'notifications',
			id: 'b', place: null, data: {},
		}, {
			name: 'trends',
			id: 'c', place: null, data: {},
		}]);
	}
});

onMounted(() => {
	window.addEventListener('resize', () => {
		isDesktop.value = (window.innerWidth >= DESKTOP_THRESHOLD);
	}, { passive: true });
});
</script>

<style lang="scss" module>
$ui-font-size: 1em;
$widgets-hide-threshold: 1200px;
.transition_widgetsDrawer_enterActive,
.transition_widgetsDrawer_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_widgetsDrawer_enterFrom,
.transition_widgetsDrawer_leaveTo {
	opacity: 0;
	transform: translateX(240px);
}
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

.transition_menuDrawerBg_enterActive,
.transition_menuDrawerBg_leaveActive {
	opacity: 1;
	transition: opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_menuDrawerBg_enterFrom,
.transition_menuDrawerBg_leaveTo {
	opacity: 0;
}

.transition_menuDrawer_enterActive,
.transition_menuDrawer_leaveActive {
	opacity: 1;
	transform: translateX(0);
	transition: transform 300ms cubic-bezier(0.23, 1, 0.32, 1), opacity 300ms cubic-bezier(0.23, 1, 0.32, 1);
}
.transition_menuDrawer_enterFrom,
.transition_menuDrawer_leaveTo {
	opacity: 0;
	transform: translateX(-240px);
}
@media (min-width: 700px) {
	.root{
		padding-right:48px;
		padding-left:24px;
	}
}
.wide{
	&.main {
		margin: 0;
		border-radius: 0;
		box-shadow: none;
		width: 100% !important;
		max-width: 900px !important;
	}
}

.root {

	min-height: 100dvh;
	box-sizing: border-box;

	&.wallpaper {
		background: var(--wallpaperOverlay);
	}

	> .tray-back {
		z-index: 1001;
	}

	> .tray {
		position: fixed;
		top: 0;
		right: 0;
		z-index: 1001;
		height: 100dvh;
		margin-top: var(--stickyTop);
		padding: var(--margin) var(--margin) calc(var(--margin) + env(safe-area-inset-bottom, 0px));
		box-sizing: border-box;
		overflow: auto;
		background: var(--bg);
	}

	> .ivnzpscs {
		position: fixed;
		bottom: 0;
		right: 0;
		width: 300px;
		height: 600px;
		border: none;
		pointer-events: none;
	}
}

.columns {
	display: flex;
	justify-content: center;
	max-width: 100%;

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
		flex: 1;
		min-width: 0;
		width: 750px;
		margin: 0 16px 0 0;
		border-left: solid 1px var(--divider);
		border-right: solid 1px var(--divider);
		border-radius: 0;
		overflow: clip;
		--margin: 12px;
		max-width: 600px;
	}

	> .widgets {
		//--panelBorder: none;
		width: 300px;
		height: 100vh;
		padding-bottom: calc(var(--margin) + env(safe-area-inset-bottom, 0px));
		position: sticky;
		overflow-y: auto;
		top: 0;
		padding-top: 16px;

		@media (max-width: $widgets-hide-threshold) {
			display: none;
		}

		&.left {
			margin-right: 16px;
		}
	}

	> .sidebar {
		width: 275px;
		height: 100vh;
		position: sticky;
		top: 0;
		padding: 20px;
	}

	&.withGlobalHeader {
		> .main {
			margin-top: 0;
			border: solid 1px var(--divider);
			border-radius: var(--radius);
			--stickyTop: var(--globalHeaderHeight);
		}

		> .widgets {
			--stickyTop: var(--globalHeaderHeight);
			margin-top: 0;
		}
	}
	@media (max-width: 1300px) {
		.sidebar {
			width: 80px;
		}
		.main {
			width: 100%;
			max-width: 100%;
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
.nav {
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
	-webkit-backdrop-filter: var(--blur, blur(24px));
	backdrop-filter: var(--blur, blur(24px));
	background-color: var(--bg);
	border-top: solid 0.5px var(--divider);
	height: 52px;
}

.menuDrawerBg {
	z-index: 1001;
}

.menuDrawer {
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

.navButton{
	font-size: 1.5em;
}
.widgetsDrawerBg {
	z-index: 1001;
}

.widgetsDrawer {
	position: fixed;
	top: 0;
	right: 0;
	z-index: 1001;
	width: 310px;
	height: 100dvh;
	padding: var(--margin) var(--margin) calc(var(--margin) + env(safe-area-inset-bottom, 0px)) !important;
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	background: var(--bg);
}
.widgetsCloseButton {
	padding: 8px;
	display: block;
	margin: 0 auto;
}
</style>
