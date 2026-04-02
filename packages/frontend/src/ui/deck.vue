<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]">
	<XTitlebar v-if="prefer.r.showTitlebar.value" style="flex-shrink: 0;"/>

	<div :class="$style.nonTitlebarArea">
		<XSidebar v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'left'"/>

		<div :class="[$style.main, { [$style.withWallpaper]: withWallpaper, [$style.withSidebarAndTitlebar]: !isMobile && prefer.r['deck.navbarPosition'].value === 'left' && prefer.r.showTitlebar.value }]" :style="{ backgroundImage: prefer.s['deck.wallpaper'] != null ? `url(${ prefer.s['deck.wallpaper'] })` : '' }">
			<XNavbarH v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'top'" :acrylic="withWallpaper"/>

			<XReloadSuggestion v-if="shouldSuggestReload"/>
			<XPreferenceRestore v-if="shouldSuggestRestoreBackup"/>
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
							:class="{ '_shadow': withWallpaper }"
							:column="columns.find(c => c.id === id)!"
							:isStacked="ids.length > 1"
							@headerWheel="onWheel"
						/>
					</section>
					<div v-if="layout.length === 0" class="_panel _gaps" :class="$style.onboarding">
						<div>{{ i18n.ts._deck.introduction }}</div>
						<div>{{ i18n.ts._deck.introduction2 }}</div>
						<MkInfo v-if="!store.r.tips.value.deck" closable @close="closeTip('deck')">
							<button class="_textButton" @click="showTour">{{ i18n.ts._deck.showHowToUse }}</button>
						</MkInfo>
					</div>
				</div>

				<div v-if="prefer.r['deck.menuPosition'].value === 'right'" :class="$style.sideMenu">
					<div :class="$style.sideMenuTop">
						<button ref="swicthProfileButtonEl" v-tooltip.noDelay.left="`${i18n.ts._deck.profile}: ${prefer.s['deck.profile']}`" :class="$style.sideMenuButton" class="_button" @click="switchProfileMenu"><i class="ti ti-caret-down"></i></button>
						<button v-tooltip.noDelay.left="i18n.ts._deck.deleteProfile" :class="$style.sideMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
					</div>
					<div :class="$style.sideMenuMiddle">
						<button ref="addColumnButtonEl" v-tooltip.noDelay.left="i18n.ts._deck.addColumn" :class="$style.sideMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
					</div>
					<div :class="$style.sideMenuBottom">
						<button ref="settingsButtonEl" v-tooltip.noDelay.left="i18n.ts.settings" :class="$style.sideMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings-2"></i></button>
					</div>
				</div>
			</div>

			<div v-if="prefer.r['deck.menuPosition'].value === 'bottom'" :class="$style.bottomMenu">
				<div :class="$style.bottomMenuLeft">
					<button ref="swicthProfileButtonEl" v-tooltip.noDelay.top="`${i18n.ts._deck.profile}: ${prefer.s['deck.profile']}`" :class="$style.bottomMenuButton" class="_button" @click="switchProfileMenu"><i class="ti ti-caret-down"></i></button>
					<button v-tooltip.noDelay.top="i18n.ts._deck.deleteProfile" :class="$style.bottomMenuButton" class="_button" @click="deleteProfile"><i class="ti ti-trash"></i></button>
				</div>
				<div :class="$style.bottomMenuMiddle">
					<button ref="addColumnButtonEl" v-tooltip.noDelay.top="i18n.ts._deck.addColumn" :class="$style.bottomMenuButton" class="_button" @click="addColumn"><i class="ti ti-plus"></i></button>
				</div>
				<div :class="$style.bottomMenuRight">
					<button ref="settingsButtonEl" v-tooltip.noDelay.top="i18n.ts.settings" :class="$style.bottomMenuButton" class="_button" @click="showSettings"><i class="ti ti-settings-2"></i></button>
				</div>
			</div>

			<XNavbarH v-if="!isMobile && prefer.r['deck.navbarPosition'].value === 'bottom'" :acrylic="withWallpaper"/>

			<XMobileFooterMenu v-if="isMobile" v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
		</div>
	</div>

	<XCommon v-model:drawerMenuShowing="drawerMenuShowing" v-model:widgetsShowing="widgetsShowing"/>
</div>
</template>

<script lang="ts" setup>
import { defineAsyncComponent, ref, useTemplateRef } from 'vue';
import XCommon from './_common_/common.vue';
import { genId } from '@/utility/id.js';
import XSidebar from '@/ui/_common_/navbar.vue';
import XNavbarH from '@/ui/_common_/navbar-h.vue';
import XMobileFooterMenu from '@/ui/_common_/mobile-footer-menu.vue';
import XTitlebar from '@/ui/_common_/titlebar.vue';
import XPreferenceRestore from '@/ui/_common_/PreferenceRestore.vue';
import XReloadSuggestion from '@/ui/_common_/ReloadSuggestion.vue';
import * as os from '@/os.js';
import { $i } from '@/i.js';
import { i18n } from '@/i18n.js';
import { deviceKind } from '@/utility/device-kind.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';
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
import XChatColumn from '@/ui/deck/chat-column.vue';
import MkInfo from '@/components/MkInfo.vue';
import { mainRouter } from '@/router.js';
import { columns, layout, columnTypes, switchProfileMenu, addColumn as addColumnToStore, deleteProfile as deleteProfile_ } from '@/deck.js';
import { shouldSuggestRestoreBackup } from '@/preferences/utility.js';
import { shouldSuggestReload } from '@/utility/reload-suggest.js';
import { startTour } from '@/utility/tour.js';
import { closeTip } from '@/tips.js';

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
	chat: XChatColumn,
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
const widgetsShowing = ref(false);
const gap = prefer.r['deck.columnGap'];

/*
const route = 'TODO';
watch(route, () => {
	drawerMenuShowing.value = false;
});
*/

function showSettings() {
	os.pageWindow('/settings/deck');
}

const columnsEl = useTemplateRef('columnsEl');
const addColumnButtonEl = useTemplateRef('addColumnButtonEl');
const settingsButtonEl = useTemplateRef('settingsButtonEl');
const swicthProfileButtonEl = useTemplateRef('swicthProfileButtonEl');

async function addColumn(ev: PointerEvent) {
	const { canceled, result: column } = await os.select({
		title: i18n.ts._deck.addColumn,
		items: columnTypes.filter(column => column !== 'chat' || $i == null || $i.policies.chatAvailability !== 'unavailable').map(column => ({
			value: column, label: i18n.ts._deck._columns[column],
		})),
	});
	if (canceled || column == null) return;

	addColumnToStore({
		type: column,
		id: genId(),
		name: null,
		width: 330,
		soundSetting: { type: null, volume: 1 },
	});
}

function onContextmenu(ev: PointerEvent) {
	os.contextMenu([{
		text: i18n.ts._deck.addColumn,
		action: addColumn,
	}], ev);
}

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

function showTour() {
	if (addColumnButtonEl.value == null ||
		settingsButtonEl.value == null ||
		swicthProfileButtonEl.value == null) {
		return;
	}

	startTour([{
		element: addColumnButtonEl.value,
		title: i18n.ts._deck._howToUse.addColumn_title,
		description: i18n.ts._deck._howToUse.addColumn_description,
	}, {
		element: settingsButtonEl.value,
		title: i18n.ts._deck._howToUse.settings_title,
		description: i18n.ts._deck._howToUse.settings_description,
	}, {
		element: swicthProfileButtonEl.value,
		title: i18n.ts._deck._howToUse.switchProfile_title,
		description: i18n.ts._deck._howToUse.switchProfile_description,
	}]).then(() => {
		closeTip('deck');
	});
}

window.document.documentElement.style.overflowY = 'hidden';
window.document.documentElement.style.scrollBehavior = 'auto';
</script>

<style lang="scss" module>
.root {
	--MI-margin: var(--MI-marginHalf);

	--columnGap: v-bind("gap + 'px'");

	display: flex;
	flex-direction: column;
	height: 100dvh;
	box-sizing: border-box;
	flex: 1;
	background: var(--MI_THEME-navBg);
}

.nonTitlebarArea {
	display: flex;
	flex: 1;
	min-height: 0;
}

.main {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;

	&:not(.withWallpaper) {
		background: var(--MI_THEME-deckBg);
	}

	&.withSidebarAndTitlebar {
		border-radius: 12px 0 0 0;
		overflow: clip;
	}
}

.columnsWrapper {
	flex: 1;
	display: flex;
	flex-direction: row;

	// これがないと狭い画面でマージンが広いデッキを表示したときにナビゲーションフッターが画面の外に追いやられて操作不能になる場合がある
	min-height: 0;
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
	display: inline-block;
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
</style>
