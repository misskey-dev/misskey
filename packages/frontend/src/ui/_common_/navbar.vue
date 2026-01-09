<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.iconOnly]: iconOnly }]">
	<div :class="$style.body">
		<div :class="$style.top">
			<button v-tooltip.noDelay.right="instance.name ?? i18n.ts.instance" class="_button" :class="$style.instance" @click="openInstanceMenu">
				<img :src="instance.iconUrl || '/favicon.ico'" alt="" :class="$style.instanceIcon" style="viewTransitionName: navbar-serverIcon;"/>
			</button>
			<button v-if="!iconOnly" v-tooltip.noDelay.right="i18n.ts.realtimeMode" class="_button" :class="[$style.realtimeMode, store.r.realtimeMode.value ? $style.on : null]" @click="toggleRealtimeMode">
				<i v-if="store.r.realtimeMode.value" class="ti ti-bolt ti-fw"></i>
				<i v-else class="ti ti-bolt-off ti-fw"></i>
			</button>
			<button v-if="!iconOnly && showWidgetButton" v-tooltip.noDelay.right="i18n.ts.widgets" class="_button" :class="[$style.widget]" @click="() => emit('widgetButtonClick')">
				<i class="ti ti-apps ti-fw"></i>
			</button>
		</div>
		<div :class="$style.middle">
			<MkA v-tooltip.noDelay.right="i18n.ts.timeline" :class="$style.item" :activeClass="$style.active" to="/" exact>
				<i :class="$style.itemIcon" class="ti ti-home ti-fw" style="viewTransitionName: navbar-homeIcon;"></i><span :class="$style.itemText">{{ i18n.ts.timeline }}</span>
			</MkA>
			<template v-for="item in prefer.r.menu.value">
				<div v-if="item === '-'" :class="$style.divider"></div>
				<component
					:is="navbarItemDef[item].to ? 'MkA' : 'button'"
					v-else-if="navbarItemDef[item] && (navbarItemDef[item].show == null || navbarItemDef[item].show.value !== false)"
					v-tooltip.noDelay.right="navbarItemDef[item].title"
					class="_button"
					:class="[$style.item]"
					:activeClass="$style.active"
					:to="navbarItemDef[item].to"
					v-on="navbarItemDef[item].action ? { click: navbarItemDef[item].action } : {}"
				>
					<i class="ti-fw" :class="[$style.itemIcon, navbarItemDef[item].icon]" :style="{ viewTransitionName: 'navbar-item-' + item }"></i><span :class="$style.itemText">{{ navbarItemDef[item].title }}</span>
					<span v-if="navbarItemDef[item].indicated" :class="$style.itemIndicator" class="_blink">
						<span v-if="navbarItemDef[item].indicateValue" class="_indicateCounter" :class="$style.itemIndicateValueIcon">{{ navbarItemDef[item].indicateValue }}</span>
						<i v-else class="_indicatorCircle"></i>
					</span>
				</component>
			</template>
			<div :class="$style.divider"></div>
			<MkA v-if="$i != null && ($i.isAdmin || $i.isModerator)" v-tooltip.noDelay.right="i18n.ts.controlPanel" :class="$style.item" :activeClass="$style.active" to="/admin">
				<i :class="$style.itemIcon" class="ti ti-dashboard ti-fw" style="viewTransitionName: navbar-controlPanel;"></i><span :class="$style.itemText">{{ i18n.ts.controlPanel }}</span>
			</MkA>
			<button class="_button" :class="$style.item" @click="more">
				<i :class="$style.itemIcon" class="ti ti-grid-dots ti-fw" style="viewTransitionName: navbar-more;"></i><span :class="$style.itemText">{{ i18n.ts.more }}</span>
				<span v-if="otherMenuItemIndicated" :class="$style.itemIndicator" class="_blink"><i class="_indicatorCircle"></i></span>
			</button>
			<MkA v-tooltip.noDelay.right="i18n.ts.settings" :class="$style.item" :activeClass="$style.active" to="/settings">
				<i :class="$style.itemIcon" class="ti ti-settings ti-fw" style="viewTransitionName: navbar-settings;"></i><span :class="$style.itemText">{{ i18n.ts.settings }}</span>
			</MkA>
		</div>
		<div :class="$style.bottom">
			<button v-if="iconOnly && showWidgetButton" v-tooltip.noDelay.right="i18n.ts.widgets" class="_button" :class="[$style.widget]" @click="() => emit('widgetButtonClick')">
				<i class="ti ti-apps ti-fw"></i>
			</button>
			<button v-if="iconOnly" v-tooltip.noDelay.right="i18n.ts.realtimeMode" class="_button" :class="[$style.realtimeMode, store.r.realtimeMode.value ? $style.on : null]" @click="toggleRealtimeMode">
				<i v-if="store.r.realtimeMode.value" class="ti ti-bolt ti-fw"></i>
				<i v-else class="ti ti-bolt-off ti-fw"></i>
			</button>
			<button v-tooltip.noDelay.right="i18n.ts.note" class="_button" :class="[$style.post]" data-cy-open-post-form @click="() => { os.post(); }">
				<i class="ti ti-pencil ti-fw" :class="$style.postIcon"></i><span :class="$style.postText">{{ i18n.ts.note }}</span>
			</button>
			<button v-if="$i != null" v-tooltip.noDelay.right="`${i18n.ts.account}: @${$i.username}`" class="_button" :class="[$style.account]" @click="openAccountMenu">
				<MkAvatar :user="$i" :class="$style.avatar" style="viewTransitionName: navbar-avatar;"/><MkAcct class="_nowrap" :class="$style.acct" :user="$i"/>
			</button>
		</div>
	</div>

	<!--
	<svg viewBox="0 0 16 48" :class="$style.subButtonShape">
		<g transform="matrix(0.333333,0,0,0.222222,0.000895785,13.3333)">
			<path d="M23.935,-24C37.223,-24 47.995,-7.842 47.995,12.09C47.995,34.077 47.995,62.07 47.995,84.034C47.995,93.573 45.469,102.721 40.972,109.466C36.475,116.211 30.377,120 24.018,120L23.997,120C10.743,120 -0.003,136.118 -0.003,156C-0.003,156 -0.003,156 -0.003,156L-0.003,-60L-0.003,-59.901C-0.003,-50.379 2.519,-41.248 7.007,-34.515C11.496,-27.782 17.584,-24 23.931,-24C23.932,-24 23.934,-24 23.935,-24Z" style="fill:var(--MI_THEME-navBg);"/>
		</g>
	</svg>
	-->

	<div v-if="!forceIconOnly && prefer.r.showNavbarSubButtons.value" :class="$style.subButtons">
		<div :class="$style.subButton">
			<svg viewBox="0 0 16 64" :class="$style.subButtonShape">
				<g transform="matrix(0.333333,0,0,0.222222,0.000895785,21.3333)">
					<path d="M47.488,7.995C47.79,10.11 47.943,12.266 47.943,14.429C47.997,26.989 47.997,84 47.997,84C47.997,84 44.018,118.246 23.997,133.5C-0.374,152.07 -0.003,192 -0.003,192L-0.003,-96C-0.003,-96 0.151,-56.216 23.997,-37.5C40.861,-24.265 46.043,-1.243 47.488,7.995Z" style="fill:var(--MI_THEME-navBg);"/>
				</g>
			</svg>
			<button class="_button" :class="$style.subButtonClickable" @click="menuEdit"><i :class="$style.subButtonIcon" class="ti ti-settings-2"></i></button>
		</div>
		<template v-if="!props.asDrawer">
			<div :class="$style.subButtonGapFill"></div>
			<div :class="$style.subButtonGapFillDivider"></div>
			<div :class="$style.subButton">
				<svg viewBox="0 0 16 64" :class="$style.subButtonShape">
					<g transform="matrix(0.333333,0,0,0.222222,0.000895785,21.3333)">
						<path d="M47.488,7.995C47.79,10.11 47.943,12.266 47.943,14.429C47.997,26.989 47.997,84 47.997,84C47.997,84 44.018,118.246 23.997,133.5C-0.374,152.07 -0.003,192 -0.003,192L-0.003,-96C-0.003,-96 0.151,-56.216 23.997,-37.5C40.861,-24.265 46.043,-1.243 47.488,7.995Z" style="fill:var(--MI_THEME-navBg);"/>
					</g>
				</svg>
				<button class="_button" :class="$style.subButtonClickable" @click="toggleIconOnly"><i v-if="iconOnly" class="ti ti-chevron-right" :class="$style.subButtonIcon"></i><i v-else class="ti ti-chevron-left" :class="$style.subButtonIcon"></i></button>
			</div>
		</template>
	</div>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, ref, watch } from 'vue';
import { openInstanceMenu } from './common.js';
import * as os from '@/os.js';
import { navbarItemDef } from '@/navbar.js';
import { store } from '@/store.js';
import { i18n } from '@/i18n.js';
import { instance } from '@/instance.js';
import { getHTMLElementOrNull } from '@/utility/get-dom-node-or-null.js';
import { useRouter } from '@/router.js';
import { prefer } from '@/preferences.js';
import { getAccountMenu } from '@/accounts.js';
import { $i } from '@/i.js';

const router = useRouter();

const props = defineProps<{
	showWidgetButton?: boolean;
	asDrawer?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'widgetButtonClick'): void;
}>();

const forceIconOnly = ref(!props.asDrawer && window.innerWidth <= 1279);
const iconOnly = computed(() => {
	return !props.asDrawer && (forceIconOnly.value || (store.r.menuDisplay.value === 'sideIcon'));
});

const otherMenuItemIndicated = computed(() => {
	for (const def in navbarItemDef) {
		if (prefer.r.menu.value.includes(def)) continue;
		if (navbarItemDef[def].indicated) return true;
	}
	return false;
});

function calcViewState() {
	forceIconOnly.value = window.innerWidth <= 1279;
}

window.addEventListener('resize', calcViewState);

watch(store.r.menuDisplay, () => {
	calcViewState();
});

function toggleIconOnly() {
	if (window.document.startViewTransition && prefer.s.animation) {
		window.document.startViewTransition(() => {
			store.set('menuDisplay', iconOnly.value ? 'sideFull' : 'sideIcon');
		});
	} else {
		store.set('menuDisplay', iconOnly.value ? 'sideFull' : 'sideIcon');
	}
}

function toggleRealtimeMode(ev: PointerEvent) {
	os.popupMenu([{
		type: 'label',
		text: i18n.ts.realtimeMode,
	}, {
		text: store.s.realtimeMode ? i18n.ts.turnItOff : i18n.ts.turnItOn,
		icon: store.s.realtimeMode ? 'ti ti-bolt-off' : 'ti ti-bolt',
		action: () => {
			store.set('realtimeMode', !store.s.realtimeMode);
			window.location.reload();
		},
	}], ev.currentTarget ?? ev.target);
}

async function openAccountMenu(ev: PointerEvent) {
	const menuItems = await getAccountMenu({
		withExtraOperation: true,
	});

	os.popupMenu(menuItems, ev.currentTarget ?? ev.target);
}

async function more(ev: PointerEvent) {
	const target = getHTMLElementOrNull(ev.currentTarget ?? ev.target);
	if (!target) return;
	const { dispose } = await os.popupAsyncWithDialog(import('@/components/MkLaunchPad.vue').then(x => x.default), {
		anchorElement: target,
	}, {
		closed: () => dispose(),
	});
}

function menuEdit() {
	router.push('/settings/navbar');
}
</script>

<style lang="scss" module>
.root {
	--nav-width: 250px;
	--nav-icon-only-width: 80px;
	--nav-bg-transparent: color(from var(--MI_THEME-navBg) srgb r g b / 0.5);

	--subButtonWidth: 20px;

	flex: 0 0 var(--nav-width);
	width: var(--nav-width);
	box-sizing: border-box;
}

.body {
	position: relative;
	width: var(--nav-icon-only-width);
	height: 100%;
	box-sizing: border-box;
	overflow: auto;
	overflow-x: clip;
	overscroll-behavior: contain;
	background: var(--MI_THEME-navBg);
	contain: strict;

	/* 画面が縦に長い、設置している項目数が少ないなどの環境においても確実にbottomを最下部に表示するため */
	display: flex;
	flex-direction: column;

	direction: rtl; /* スクロールバーを左に表示したいため */
}

.top {
	flex-shrink: 0;
	direction: ltr;

	/* 疑似progressive blur */
	&::before {
		position: absolute;
		z-index: -1;
		inset: 0;
		content: "";
		backdrop-filter: blur(8px);
		mask-image: linear-gradient(
			to top,
			rgb(0 0 0 / 0%) 0%,
			rgb(0 0 0 / 4.9%) 7.75%,
			rgb(0 0 0 / 10.4%) 11.25%,
			rgb(0 0 0 / 45%) 23.55%,
			rgb(0 0 0 / 55%) 26.45%,
			rgb(0 0 0 / 89.6%) 38.75%,
			rgb(0 0 0 / 95.1%) 42.25%,
			rgb(0 0 0 / 100%) 50%
		);
	}

	&::after {
		position: absolute;
		z-index: -1;
		inset: 0;
		bottom: 25%;
		content: "";
		backdrop-filter: blur(16px);
		mask-image: linear-gradient(
			to top,
			rgb(0 0 0 / 0%) 0%,
			rgb(0 0 0 / 4.9%) 15.5%,
			rgb(0 0 0 / 10.4%) 22.5%,
			rgb(0 0 0 / 45%) 47.1%,
			rgb(0 0 0 / 55%) 52.9%,
			rgb(0 0 0 / 89.6%) 77.5%,
			rgb(0 0 0 / 95.1%) 91.9%,
			rgb(0 0 0 / 100%) 100%
		);
	}
}

.middle {
	flex: 1;
	direction: ltr;
}

.bottom {
	flex-shrink: 0;
	direction: ltr;

	/* 疑似progressive blur */
	&::before {
		position: absolute;
		z-index: -1;
		inset: -30px 0 0 0;
		content: "";
		backdrop-filter: blur(8px);
		mask-image: linear-gradient(
			to bottom,
			rgb(0 0 0 / 0%) 0%,
			rgb(0 0 0 / 4.9%) 7.75%,
			rgb(0 0 0 / 10.4%) 11.25%,
			rgb(0 0 0 / 45%) 23.55%,
			rgb(0 0 0 / 55%) 26.45%,
			rgb(0 0 0 / 89.6%) 38.75%,
			rgb(0 0 0 / 95.1%) 42.25%,
			rgb(0 0 0 / 100%) 50%
		);
		pointer-events: none;
	}

	&::after {
		position: absolute;
		z-index: -1;
		inset: 0;
		top: 25%;
		content: "";
		backdrop-filter: blur(16px);
		mask-image: linear-gradient(
			to bottom,
			rgb(0 0 0 / 0%) 0%,
			rgb(0 0 0 / 4.9%) 15.5%,
			rgb(0 0 0 / 10.4%) 22.5%,
			rgb(0 0 0 / 45%) 47.1%,
			rgb(0 0 0 / 55%) 52.9%,
			rgb(0 0 0 / 89.6%) 77.5%,
			rgb(0 0 0 / 95.1%) 91.9%,
			rgb(0 0 0 / 100%) 100%
		);
	}
}

.subButtons {
	position: fixed;
	left: var(--nav-width);
	bottom: 80px;
	z-index: 1001;
	box-sizing: border-box;
}

.subButton {
	display: block;
	position: relative;
	z-index: 1002;
	width: var(--subButtonWidth);
	height: 50px;
	box-sizing: border-box;
	align-content: center;
}

.subButtonShape {
	position: absolute;
	z-index: -1;
	top: 0;
	bottom: 0;
	left: 0;
	margin: auto;
	width: var(--subButtonWidth);
	height: calc(var(--subButtonWidth) * 4);
}

.subButtonClickable {
	position: absolute;
	display: block;
	max-width: unset;
	width: 24px;
	height: 42px;
	top: 0;
	bottom: 0;
	left: -4px;
	margin: auto;
	font-size: 10px;

	&:hover {
		color: var(--MI_THEME-fgHighlighted);

		.subButtonIcon {
			opacity: 1;
		}
	}
}

.subButtonIcon {
	margin-left: -4px;
	opacity: 0.7;
}

.subButtonGapFill {
	position: relative;
	z-index: 1001;
	width: var(--subButtonWidth);
	height: 64px;
	margin-top: -32px;
	margin-bottom: -32px;
	pointer-events: none;
	background: var(--MI_THEME-navBg);
}

.subButtonGapFillDivider {
	position: relative;
	z-index: 1010;
	margin-left: -2px;
	width: 14px;
	height: 1px;
	background: var(--MI_THEME-divider);
	pointer-events: none;
}

.root:not(.iconOnly) {
	.body {
		width: var(--nav-width);
	}

	.top {
		--top-height: 80px;

		position: sticky;
		top: 0;
		z-index: 1;
		display: flex;
		height: var(--top-height);
		padding-left: 6px;
	}

	.instance {
		position: relative;
		width: var(--top-height);
	}

	.instanceIcon {
		display: inline-block;
		width: 38px;
		aspect-ratio: 1;
		border-radius: 8px;
	}

	.realtimeMode {
		display: inline-block;
		width: var(--top-height);
		margin-left: auto;

		&.on {
			color: var(--MI_THEME-accent);
		}
	}

	.widget {
		display: inline-block;
		width: var(--top-height);
		margin-left: auto;
	}

	.bottom {
		position: sticky;
		bottom: 0;
		padding-top: 20px;
	}

	.post {
		position: relative;
		display: block;
		width: 100%;
		height: 40px;
		color: var(--MI_THEME-fgOnAccent);
		font-weight: bold;
		text-align: left;

		&::before {
			content: "";
			display: block;
			width: calc(100% - 38px);
			height: 100%;
			margin: auto;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			border-radius: 999px;
			background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
		}

		&:focus-visible {
			outline: none;

			&::before {
				outline: 2px solid var(--MI_THEME-fgOnAccent);
				outline-offset: -4px;
			}
		}

		&:hover, &.active {
			&::before {
				background: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
			}
		}
	}

	.postIcon {
		position: relative;
		margin-left: 30px;
		margin-right: 8px;
		width: 32px;
	}

	.postText {
		position: relative;
	}

	.account {
		position: relative;
		display: flex;
		align-items: center;
		padding: 20px 0 20px 30px;
		width: 100%;
		text-align: left;
		box-sizing: border-box;
		overflow: clip;

		&:focus-visible {
			outline: none;

			> .avatar {
				box-shadow: 0 0 0 4px var(--MI_THEME-focus);
			}
		}
	}

	.avatar {
		display: block;
		flex-shrink: 0;
		position: relative;
		width: 32px;
		aspect-ratio: 1;
		margin-right: 8px;
	}

	.acct {
		display: block;
		flex-shrink: 1;
		padding-right: 8px;
	}

	.divider {
		margin: 16px 16px;
		border-top: solid 0.5px var(--MI_THEME-divider);
	}

	.item {
		position: relative;
		display: block;
		padding-left: 30px;
		line-height: 2.85rem;
		text-overflow: ellipsis;
		overflow: hidden;
		white-space: nowrap;
		width: 100%;
		text-align: left;
		box-sizing: border-box;
		color: var(--MI_THEME-navFg);

		&:hover {
			text-decoration: none;
			color: light-dark(hsl(from var(--MI_THEME-navFg) h s calc(l - 17)), hsl(from var(--MI_THEME-navFg) h s calc(l + 17)));
		}

		&.active {
			color: var(--MI_THEME-navActive);
		}

		&:focus-visible {
			outline: none;

			&::before {
				outline: 2px solid var(--MI_THEME-focus);
				outline-offset: -2px;
			}
		}

		&:hover, &.active, &:focus {
			color: var(--MI_THEME-accent);

			&::before {
				content: "";
				display: block;
				width: calc(100% - 34px);
				height: 100%;
				margin: auto;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border-radius: 999px;
				background: var(--MI_THEME-accentedBg);
			}
		}
	}

	.itemIcon {
		position: relative;
		width: 32px;
		margin-right: 8px;
	}

	.itemIndicator {
		position: absolute;
		top: 0;
		left: 20px;
		color: var(--MI_THEME-navIndicator);
		font-size: 8px;

		&:has(.itemIndicateValueIcon) {
			animation: none;
			left: auto;
			right: 40px;
			font-size: 10px;
		}
	}

	.itemText {
		position: relative;
		font-size: 0.9em;
	}

	.subButtons {
		left: var(--nav-width);
	}
}

.root.iconOnly {
	flex: 0 0 var(--nav-icon-only-width);
	width: var(--nav-icon-only-width);

	.body {
		width: var(--nav-icon-only-width);
	}

	.top {
		position: sticky;
		top: 0;
		z-index: 1;
		padding: 20px 0;
	}

	.instance {
		display: block;
		text-align: center;
		width: 100%;

		&:focus-visible {
			outline: none;

			> .instanceIcon {
				outline: 2px solid var(--MI_THEME-focus);
				outline-offset: 2px;
			}
		}
	}

	.instanceIcon {
		display: inline-block;
		width: 30px;
		aspect-ratio: 1;
		border-radius: 8px;
	}

	.bottom {
		position: sticky;
		bottom: 0;
		padding-top: 20px;
	}

	.widget {
		display: block;
		position: relative;
		width: 100%;
		height: 52px;
		text-align: center;
	}

	.realtimeMode {
		display: block;
		position: relative;
		width: 100%;
		height: 52px;
		text-align: center;

		&.on {
			color: var(--MI_THEME-accent);
		}
	}

	.post {
		display: block;
		position: relative;
		width: 100%;
		height: 52px;
		text-align: center;

		&::before {
			content: "";
			display: block;
			position: absolute;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			margin: auto;
			width: 52px;
			aspect-ratio: 1/1;
			border-radius: 100%;
			background: linear-gradient(90deg, var(--MI_THEME-buttonGradateA), var(--MI_THEME-buttonGradateB));
		}

		&:focus-visible {
			outline: none;

			&::before {
				outline: 2px solid var(--MI_THEME-fgOnAccent);
				outline-offset: -4px;
			}
		}

		&:hover, &.active {
			&::before {
				background: hsl(from var(--MI_THEME-accent) h s calc(l + 10));
			}
		}
	}

	.postIcon {
		position: relative;
		color: var(--MI_THEME-fgOnAccent);
	}

	.postText {
		display: none;
	}

	.account {
		display: block;
		text-align: center;
		padding: 20px 0;
		width: 100%;
		overflow: clip;

		&:focus-visible {
			outline: none;

			> .avatar {
				box-shadow: 0 0 0 4px var(--MI_THEME-focus);
			}
		}
	}

	.avatar {
		display: inline-block;
		width: 38px;
		aspect-ratio: 1;
	}

	.acct {
		display: none;
	}

	.divider {
		margin: 8px auto;
		width: calc(100% - 32px);
		border-top: solid 0.5px var(--MI_THEME-divider);
	}

	.item {
		display: block;
		position: relative;
		padding: 16px 0;
		width: 100%;
		text-align: center;

		&:focus-visible {
			outline: none;

			&::before {
				outline: 2px solid var(--MI_THEME-focus);
				outline-offset: -2px;
			}
		}

		&:hover, &.active, &:focus {
			text-decoration: none;
			color: var(--MI_THEME-accent);

			&::before {
				content: "";
				display: block;
				height: 100%;
				aspect-ratio: 1;
				margin: auto;
				position: absolute;
				top: 0;
				left: 0;
				right: 0;
				bottom: 0;
				border-radius: 999px;
				background: var(--MI_THEME-accentedBg);
			}

			> .icon,
			> .text {
				opacity: 1;
			}
		}
	}

	.itemIcon {
		display: block;
		margin: 0 auto;
		opacity: 0.7;
	}

	.itemText {
		display: none;
	}

	.itemIndicator {
		position: absolute;
		top: 6px;
		left: 24px;
		color: var(--MI_THEME-navIndicator);
		font-size: 8px;

		&:has(.itemIndicateValueIcon) {
			animation: none;
			top: 4px;
			left: auto;
			right: 4px;
			font-size: 10px;
		}
	}

	.subButtons {
		left: var(--nav-icon-only-width);
	}
}
</style>
