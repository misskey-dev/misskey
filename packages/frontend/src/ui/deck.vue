<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.withWallpaper]: withWallpaper }]">
	<XSidebar v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'left'"/>

	<div :class="$style.main">
		<XNavbarH v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'top'"/>

		<XAnnouncements v-if="$i"/>
		<XStatusBars/>
		<div :class="$style.columnsWrapper">
		  <!-- passive: https://bugs.webkit.org/show_bug.cgi?id=281300 -->
			<div ref="columnsEl" :class="[$style.columns, { [$style.center]: prefer.r['deck.columnAlign'].value === 'center', [$style.snapScroll]: snapScroll }]" @contextmenu.self.prevent="onContextmenu" @wheel.passive.self="onWheel">
				<!-- sectionを利用しているのは、deck.vue側でcolumnに対してfirst-of-typeを効かせるため -->
				<section
					v-for="ids in layout"
					:class="$style.section"
					:style="columns.filter(c => ids.includes(c.id)).some(c => c.flexible) ? { flex: 1, minWidth: '350px' } : { width: Math.max(...columns.filter(c => ids.includes(c.id)).map(c => c.width)) + 'px' }"
					@wheel.passive.self="onWheel"
				>
					<component
						:is="columnComponents[columns.find(c => c.id === id)!.type] ?? XTlColumn"
						v-for="id in ids"
						:ref="id"
						:key="id"
						:class="[$style.column, { '_shadow': withWallpaper }]"
						:column="columns.find(c => c.id === id)!"
						:isStacked="ids.length > 1"
						@headerWheel="onWheel"
					/>
				</section>
				<div v-if="layout.length === 0" class="_panel" :class="$style.onboarding">
					<div>{{ i18n.ts._deck.introduction }}</div>
					<div>{{ i18n.ts._deck.introduction2 }}</div>
				</div>
			</div>

			<div v-if="prefer.r['deck.menuPosition'].value === 'right'" :class="$style.sideMenu">
				<div :class="$style.sideMenuTop">
					<button v-tooltip.noDelay.left="`${i18n.ts._deck.profile}: ${prefer.s['deck.profile']}`" :class="$style.sideMenuButton" class="_button" @click="switchProfileMenu"><i class="ti ti-caret-down"></i></button>
					<button v-tooltip.noDelay.left="i18n.ts._deck.deleteProfile" :class="$style.sideMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
				</div>
				<div :class="$style.sideMenuMiddle">
					<button v-tooltip.noDelay.left="i18n.ts._deck.addColumn" :class="$style.sideMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
				</div>
				<div :class="$style.sideMenuBottom">
					<button v-tooltip.noDelay.left="i18n.ts.settings" :class="$style.sideMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings-2"></i></button>
				</div>
			</div>
		</div>

		<div v-if="prefer.r['deck.menuPosition'].value === 'bottom'" :class="$style.bottomMenu">
			<div :class="$style.bottomMenuLeft">
				<button v-tooltip.noDelay.left="`${i18n.ts._deck.profile}: ${prefer.s['deck.profile']}`" :class="$style.bottomMenuButton" class="_button" @click="switchProfileMenu"><i class="ti ti-caret-down"></i></button>
				<button v-tooltip.noDelay.left="i18n.ts._deck.deleteProfile" :class="$style.bottomMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
			</div>
			<div :class="$style.bottomMenuMiddle">
				<button v-tooltip.noDelay.left="i18n.ts._deck.addColumn" :class="$style.bottomMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
			</div>
			<div :class="$style.bottomMenuRight">
				<button v-tooltip.noDelay.left="i18n.ts.settings" :class="$style.bottomMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings-2"></i></button>
			</div>
		</div>

		<XNavbarH v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'bottom'"/>

		<div v-if="isMobile" :class="$style.nav">
			<button :class="$style.navButton" class="_button" @click="drawerMenuShowing = true"><i :class="$style.navButtonIcon" class="ti ti-menu-2"></i><span v-if="menuIndicated" :class="$style.navButtonIndicator" class="_blink"><i class="_indicatorCircle"></i></span></button>
			<button :class="$style.navButton" class="_button" @click="mainRouter.push('/')"><i :class="$style.navButtonIcon" class="ti ti-home"></i></button>
			<button :class="$style.navButton" class="_button" @click="mainRouter.push('/my/notifications')">
				<i :class="$style.navButtonIcon" class="ti ti-bell"></i>
				<span v-if="$i?.hasUnreadNotification" :class="$style.navButtonIndicator" class="_blink">
					<span class="_indicateCounter" :class="$style.itemIndicateValueIcon">{{ $i.unreadNotificationsCount > 99 ? '99+' : $i.unreadNotificationsCount }}</span>
				</span>
			</button>
			<button :class="$style.postButton" class="_button" @click="os.post()"><i :class="$style.navButtonIcon" class="ti ti-pencil"></i></button>
		</div>
	</div>

	<Transition
		:enterActiveClass="prefer.s.animation ? $style.transition_menuDrawerBg_enterActive : ''"
		:leaveActiveClass="prefer.s.animation ? $style.transition_menuDrawerBg_leaveActive : ''"
		:enterFromClass="prefer.s.animation ? $style.transition_menuDrawerBg_enterFrom : ''"
		:leaveToClass="prefer.s.animation ? $style.transition_menuDrawerBg_leaveTo : ''"
	>
		<div
			v-if="drawerMenuShowing"
			:class="$style.menuBg"
			class="_modalBg"
			@click="drawerMenuShowing = false"
			@touchstart.passive="drawerMenuShowing = false"
		></div>
	</Transition>

	<Transition
		:enterActiveClass="prefer.s.animation ? $style.transition_menuDrawer_enterActive : ''"
		:leaveActiveClass="prefer.s.animation ? $style.transition_menuDrawer_leaveActive : ''"
		:enterFromClass="prefer.s.animation ? $style.transition_menuDrawer_enterFrom : ''"
		:leaveToClass="prefer.s.animation ? $style.transition_menuDrawer_leaveTo : ''"
	>
		<div v-if="drawerMenuShowing" :class="$style.menu">
			<XDrawerMenu/>
		</div>
	</Transition>

	<XCommon/>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, useTemplateRef } from 'vue';
import { v4 as uuid } from 'uuid';
import XCommon from './_common_/common.vue';
import XSidebar from '@/ui/_common_/navbar.vue';
import XNavbarH from '@/ui/_common_/navbar-h.vue';
import XDrawerMenu from '@/ui/_common_/navbar-for-mobile.vue';
import * as os from '@/os.js';
import { navbarItemDef } from '@/navbar.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { deviceKind } from '@/utility/device-kind.js';
import { prefer } from '@/preferences.js';
import XMainColumn from '@/ui/deck/main-column.vue';
import XTlColumn from '@/ui/deck/tl-column.vue';
import XAntennaColumn from '@/ui/deck/antenna-column.vue';
import XListColumn from '@/ui/deck/list-column.vue';
import XChannelColumn from '@/ui/deck/channel-column.vue';
import XNotificationsColumn from '@/ui/deck/notifications-column.vue';
import XWidgetsColumn from '@/ui/deck/widgets-column.vue';
import XMentionsColumn from '@/ui/deck/mentions-column.vue';
import XDirectColumn from '@/ui/deck/direct-column.vue';
import XRoleTimelineColumn from '@/ui/deck/role-timeline-column.vue';
import { mainRouter } from '@/router.js';
import { columns, layout, columnTypes, switchProfileMenu, addColumn as addColumnToStore, deleteProfile as deleteProfile_ } from '@/deck.js';

const XStatusBars = defineAsyncComponent(() => import('@/ui/_common_/statusbars.vue'));
const XAnnouncements = defineAsyncComponent(() => import('@/ui/_common_/announcements.vue'));

const columnComponents = {
	main: XMainColumn,
	widgets: XWidgetsColumn,
	notifications: XNotificationsColumn,
	tl: XTlColumn,
	list: XListColumn,
	channel: XChannelColumn,
	antenna: XAntennaColumn,
	mentions: XMentionsColumn,
	direct: XDirectColumn,
	roleTimeline: XRoleTimelineColumn,
};

mainRouter.navHook = (path, flag): boolean => {
	if (flag === 'forcePage') return false;
	const noMainColumn = !columns.value.some(x => x.type === 'main');
	if (prefer.s['deck.navWindow'] || noMainColumn) {
		os.pageWindow(path);
		return true;
	}
	return false;
};

const isMobile = ref(window.innerWidth <= 500);
window.addEventListener('resize', () => {
	isMobile.value = window.innerWidth <= 500;
});

// ポインターイベント非対応用に初期値はUAから出す
const snapScroll = ref(deviceKind === 'smartphone' || deviceKind === 'tablet');
const withWallpaper = prefer.s['deck.wallpaper'] != null;
const drawerMenuShowing = ref(false);
const gap = prefer.r['deck.columnGap'];

/*
const route = 'TODO';
watch(route, () => {
	drawerMenuShowing.value = false;
});
*/

const menuIndicated = computed(() => {
	if ($i == null) return false;
	for (const def in navbarItemDef) {
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

function showSettings() {
	os.pageWindow('/settings/deck');
}

const columnsEl = useTemplateRef('columnsEl');

const addColumn = async (ev) => {
	const { canceled, result: column } = await os.select({
		title: i18n.ts._deck.addColumn,
		items: columnTypes.map(column => ({
			value: column, text: i18n.ts._deck._columns[column],
		})),
	});
	if (canceled || column == null) return;

	addColumnToStore({
		type: column,
		id: uuid(),
		name: null,
		width: 330,
		soundSetting: { type: null, volume: 1 },
	});
};

const onContextmenu = (ev) => {
	os.contextMenu([{
		text: i18n.ts._deck.addColumn,
		action: addColumn,
	}], ev);
};

// タッチでスクロールしてるときはスナップスクロールを有効にする
function pointerEvent(ev: PointerEvent) {
	snapScroll.value = ev.pointerType === 'touch';
}

window.document.addEventListener('pointerdown', pointerEvent, { passive: true });

function onWheel(ev: WheelEvent) {
  // WheelEvent はマウスからしか発火しないのでスナップスクロールは無効化する
  snapScroll.value = false;
	if (ev.deltaX === 0 && columnsEl.value != null) {
		columnsEl.value.scrollLeft += ev.deltaY;
	}
}

async function deleteProfile() {
	if (prefer.s['deck.profile'] == null) return;

	const { canceled } = await os.confirm({
		type: 'warning',
		text: i18n.tsx.deleteAreYouSure({ x: prefer.s['deck.profile'] }),
	});
	if (canceled) return;

	await deleteProfile_(prefer.s['deck.profile']);

	os.success();
}

window.document.documentElement.style.overflowY = 'hidden';
window.document.documentElement.style.scrollBehavior = 'auto';

if (prefer.s['deck.wallpaper'] != null) {
	window.document.documentElement.style.backgroundImage = `url(${prefer.s['deck.wallpaper']})`;
}
</script>

<style lang="scss" module>
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

.root {
	$nav-hide-threshold: 650px; // TODO: どこかに集約したい

	--MI-margin: var(--MI-marginHalf);

	--columnGap: v-bind("gap + 'px'");

	display: flex;
	height: 100dvh;
	box-sizing: border-box;
	flex: 1;

	&.withWallpaper {
		.main {
			background: transparent;
		}
	}
}

.main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	background: var(--MI_THEME-deckBg);
}

.columnsWrapper {
	flex: 1;
	display: flex;
	flex-direction: row;
}

.columns {
	flex: 1;
	display: flex;
	overflow-x: auto;
	overflow-y: clip;
	overscroll-behavior: contain;
	padding: var(--columnGap);
	gap: var(--columnGap);

	&.center {
		> .section:first-of-type {
			margin-left: auto !important;
		}

		> .section:last-of-type {
			margin-right: auto !important;
		}
	}

	&.snapScroll {
		scroll-snap-type: x mandatory;
	}
}

.section {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
	gap: var(--columnGap);
	scroll-snap-align: start;
	scroll-margin-left: var(--columnGap);
}

.onboarding {
	padding: 32px;
	height: min-content;
	text-align: center;
	margin: auto;
}

.sideMenu {
	flex-shrink: 0;
	margin-right: 0;
	margin-left: auto;
	display: flex;
	flex-direction: column;
	justify-content: center;
	width: 32px;
}

.sideMenuButton {
	display: block;
	width: 100%;
	aspect-ratio: 1;
}

.sideMenuTop {
	margin-bottom: auto;
}

.sideMenuMiddle {
	margin-top: auto;
	margin-bottom: auto;
}

.sideMenuBottom {
	margin-top: auto;
}

.bottomMenu {
	flex-shrink: 0;
	display: flex;
	flex-direction: row;
	justify-content: center;
	height: 32px;
}

.bottomMenuButton {
	display: block;
	height: 100%;
	aspect-ratio: 1;
}

.bottomMenuLeft {
	margin-right: auto;
}

.bottomMenuMiddle {
	margin-left: auto;
	margin-right: auto;
}

.bottomMenuRight {
	margin-left: auto;
}

.menuBg {
	z-index: 1001;
}

.menu {
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
	background: var(--MI_THEME-navBg);
}

.nav {
	padding: 12px 12px max(12px, env(safe-area-inset-bottom, 0px)) 12px;
	display: grid;
	grid-template-columns: 1fr 1fr 1fr 1fr;
	grid-gap: 8px;
	width: 100%;
	box-sizing: border-box;
	-webkit-backdrop-filter: var(--MI-blur, blur(32px));
	backdrop-filter: var(--MI-blur, blur(32px));
	background-color: var(--MI_THEME-header);
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.navButton {
	position: relative;
	padding: 0;
	aspect-ratio: 1;
	width: 100%;
	max-width: 60px;
	margin: auto;
	border-radius: 100%;
	background: var(--MI_THEME-panel);
	color: var(--MI_THEME-fg);

	&:hover {
		background: var(--MI_THEME-panelHighlight);
	}

	&:active {
		background: hsl(from var(--MI_THEME-panel) h s calc(l - 2));
	}
}

.postButton {
	composes: navButton;
	background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
	color: var(--MI_THEME-fgOnAccent);

	&:hover {
		background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
	}

	&:active {
		background: linear-gradient(90deg, hsl(from var(--MI_THEME-accent) h s calc(l + 5)), hsl(from var(--MI_THEME-accent) h s calc(l + 5)));
	}
}

.navButtonIcon {
	font-size: 18px;
	vertical-align: middle;
}

.navButtonIndicator {
	position: absolute;
	top: 0;
	left: 0;
	color: var(--MI_THEME-indicator);
	font-size: 16px;

	&:has(.itemIndicateValueIcon) {
		animation: none;
		font-size: 12px;
	}
}
</style>
