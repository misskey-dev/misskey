<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template :class="{ [$style.asDrawer]: asDrawer, [$style.big]: big, [$style.center]: center }">
<div v-if="item.type === 'divider'" role="separator" tabindex="-1" :class="$style.divider"></div>
<span v-else-if="item.type === 'label'" role="menuitem" tabindex="-1" :class="[$style.label, $style.item]">
	<span style="opacity: 0.7;">{{ item.text }}</span>
</span>
<span v-else-if="item.type === 'pending'" role="menuitem" tabindex="0" :class="[$style.pending, $style.item]">
	<span><MkEllipsis/></span>
</span>
<MkA
	v-else-if="item.type === 'link'"
	role="menuitem"
	tabindex="0"
	:class="['_button', $style.item]"
	:to="item.to"
	@click.passive="close(true)"
	@mouseenter.passive="onItemMouseEnter"
	@mouseleave.passive="onItemMouseLeave"
>
	<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
	<MkAvatar v-if="item.avatar" :user="item.avatar" :class="$style.avatar"/>
	<div :class="$style.item_content">
		<span :class="$style.item_content_text">{{ item.text }}</span>
		<span v-if="item.indicate" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
	</div>
</MkA>
<a
	v-else-if="item.type === 'a'"
	role="menuitem"
	tabindex="0"
	:class="['_button', $style.item]"
	:href="item.href"
	:target="item.target"
	:rel="item.target === '_blank' ? 'noopener noreferrer' : undefined"
	:download="item.download"
	@click.passive="close(true)"
	@mouseenter.passive="onItemMouseEnter"
	@mouseleave.passive="onItemMouseLeave"
>
	<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
	<div :class="$style.item_content">
		<span :class="$style.item_content_text">{{ item.text }}</span>
		<span v-if="item.indicate" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
	</div>
</a>
<button
	v-else-if="item.type === 'user'"
	role="menuitem"
	tabindex="0"
	:class="['_button', $style.item, { [$style.active]: item.active }]"
	@click.prevent="item.active ? close(false) : clicked(item.action, $event)"
	@mouseenter.passive="onItemMouseEnter"
	@mouseleave.passive="onItemMouseLeave"
>
	<MkAvatar :user="item.user" :class="$style.avatar"/><MkUserName :user="item.user"/>
	<div v-if="item.indicate" :class="$style.item_content">
		<span :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
	</div>
</button>
<button
	v-else-if="item.type === 'switch'"
	role="menuitemcheckbox"
	tabindex="0"
	:class="['_button', $style.item]"
	:disabled="unref(item.disabled)"
	@click.prevent="switchItem(item)"
	@mouseenter.passive="onItemMouseEnter"
	@mouseleave.passive="onItemMouseLeave"
>
	<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
	<MkSwitchButton v-else :class="$style.switchButton" :checked="item.ref" :disabled="item.disabled" @toggle="switchItem(item)"/>
	<div :class="$style.item_content">
		<span :class="[$style.item_content_text, { [$style.switchText]: !item.icon }]">{{ item.text }}</span>
		<MkSwitchButton v-if="item.icon" :class="[$style.switchButton, $style.caret]" :checked="item.ref" :disabled="item.disabled" @toggle="switchItem(item)"/>
	</div>
</button>
<button
	v-else-if="item.type === 'radio'"
	role="menuitem"
	tabindex="0"
	:class="['_button', $style.item, $style.parent, { [$style.active]: childShowingItem === item }]"
	:disabled="unref(item.disabled)"
	@mouseenter.prevent="preferClick ? null : showRadioOptions(item, $event)"
	@keydown.enter.prevent="preferClick ? null : showRadioOptions(item, $event)"
	@click.prevent="!preferClick ? null : showRadioOptions(item, $event)"
>
	<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]" style="pointer-events: none;"></i>
	<div :class="$style.item_content">
		<span :class="$style.item_content_text" style="pointer-events: none;">{{ item.text }}</span>
		<span :class="$style.caret" style="pointer-events: none;"><i class="ti ti-chevron-right ti-fw"></i></span>
	</div>
</button>
<button
	v-else-if="item.type === 'radioOption'"
	role="menuitemradio"
	tabindex="0"
	:class="['_button', $style.item, $style.radio, { [$style.active]: unref(item.active) }]"
	@click.prevent="unref(item.active) ? null : clicked(item.action, $event, false)"
	@mouseenter.passive="onItemMouseEnter"
	@mouseleave.passive="onItemMouseLeave"
>
	<div :class="$style.icon">
		<span :class="[$style.radioIcon, { [$style.radioChecked]: unref(item.active) }]"></span>
	</div>
	<div :class="$style.item_content">
		<span :class="$style.item_content_text">{{ item.text }}</span>
	</div>
</button>
<button
	v-else-if="item.type === 'parent'"
	role="menuitem"
	tabindex="0"
	:class="['_button', $style.item, $style.parent, { [$style.active]: childShowingItem === item }]"
	@mouseenter.prevent="preferClick ? null : showChildren(item, $event)"
	@keydown.enter.prevent="preferClick ? null : showChildren(item, $event)"
	@click.prevent="!preferClick ? null : showChildren(item, $event)"
>
	<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]" style="pointer-events: none;"></i>
	<div :class="$style.item_content">
		<span :class="$style.item_content_text" style="pointer-events: none;">{{ item.text }}</span>
		<span :class="$style.caret" style="pointer-events: none;"><i class="ti ti-chevron-right ti-fw"></i></span>
	</div>
</button>
<button
	v-else role="menuitem"
	tabindex="0"
	:class="['_button', $style.item, { [$style.danger]: item.danger, [$style.active]: unref(item.active) }]"
	@click.prevent="unref(item.active) ? close(false) : clicked(item.action, $event)"
	@mouseenter.passive="onItemMouseEnter"
	@mouseleave.passive="onItemMouseLeave"
>
	<i v-if="item.icon" class="ti-fw" :class="[$style.icon, item.icon]"></i>
	<MkAvatar v-if="item.avatar" :user="item.avatar" :class="$style.avatar"/>
	<div :class="$style.item_content">
		<span :class="$style.item_content_text">{{ item.text }}</span>
		<span v-if="item.indicate" :class="$style.indicator" class="_blink"><i class="_indicatorCircle"></i></span>
	</div>
</button>
</template>

<script setup lang="ts">
import { unref } from 'vue';
import type { MenuItem, InnerMenuItem, MenuAction, MenuParent, MenuRadio, MenuSwitch } from '@/types/menu.js';
import MkSwitchButton from '@/components/MkSwitch.button.vue';
import { isTouchUsing } from '@/scripts/touch';

const props = withDefaults(defineProps<{
	item: InnerMenuItem;
	childShowingItem: MenuItem | null;

	asDrawer?: boolean;
	big?: boolean;
	center?: boolean;
}>(), {
	asDrawer: false,
	big: false,
	center: false,
});

let preferClick = isTouchUsing || props.asDrawer;

const emit = defineEmits<{
	(ev: 'close', value: boolean): void;
	(ev: 'showRadioOptions', item: MenuRadio, event: MouseEvent | KeyboardEvent): void;
	(ev: 'showChildren', item: MenuParent, event: MouseEvent | KeyboardEvent): Promise<void>;
	(ev: 'onItemMouseEnter', rawEv: MouseEvent): void;
	(ev: 'onItemMouseLeave', rawEv: MouseEvent): void;
}>();

function close(value: boolean) {
	emit('close', value);
}

function clicked(fn: MenuAction, ev: MouseEvent, doClose: boolean = true) {
	fn(ev);

	if (!doClose) return;
	close(true);
}

function showRadioOptions(item: MenuRadio, ev: MouseEvent | KeyboardEvent) {
	emit('showRadioOptions', item, ev);
}

function showChildren(item: MenuParent, ev: MouseEvent | KeyboardEvent) {
	emit('showChildren', item, ev);
}

function switchItem(item: MenuSwitch & { ref: any }) {
	if (item.disabled !== undefined && (typeof item.disabled === 'boolean' ? item.disabled : item.disabled.value)) return;
	item.ref = !item.ref;
}

function onItemMouseEnter(ev: MouseEvent) {
	emit('onItemMouseEnter', ev);
}

function onItemMouseLeave(ev: MouseEvent) {
	emit('onItemMouseLeave', ev);
}

</script>

<style module lang="scss">
.center.item {
	text-align: center;
}

.big:not(.asDrawer).item {
	padding: 6px 20px;
	font-size: 0.95em;
	line-height: 24px;
}

.asDrawer {
	&.item {
		font-size: 1em;
		padding: 12px 24px;

		&::before {
			width: calc(100% - 24px);
			border-radius: 12px;
		}

		> .icon {
			margin-right: 14px;
			width: 24px;
		}
	}

	&.divider {
		margin: 12px 0;
	}
}

.item {
	display: flex;
	align-items: center;
	position: relative;
	padding: 5px 16px;
	width: 100%;
	box-sizing: border-box;
	white-space: nowrap;
	font-size: 0.9em;
	line-height: 20px;
	text-align: left;
	overflow: hidden;
	text-overflow: ellipsis;
	text-decoration: none !important;
	color: var(--menuFg, var(--MI_THEME-fg));

	&::before {
		content: "";
		display: block;
		position: absolute;
		z-index: -1;
		top: 0;
		left: 0;
		right: 0;
		margin: auto;
		width: calc(100% - 16px);
		height: 100%;
		border-radius: 6px;
	}

	&:focus-visible {
		outline: none;

		&:not(:hover):not(:active)::before {
			outline: var(--MI_THEME-focus) solid 2px;
			outline-offset: -2px;
		}
	}

	&:not(:disabled) {
		&:hover,
		&:focus-visible:active,
		&:focus-visible.active {
			color: var(--menuHoverFg, var(--MI_THEME-accent));

			&::before {
				background-color: var(--menuHoverBg, var(--MI_THEME-accentedBg));
			}
		}

		&:not(:focus-visible):active,
		&:not(:focus-visible).active {
			color: var(--menuActiveFg, var(--MI_THEME-fgOnAccent));

			&::before {
				background-color: var(--menuActiveBg, var(--MI_THEME-accent));
			}
		}
	}

	&:disabled {
		cursor: not-allowed;
	}

	&.danger {
		--menuFg: #ff2a2a;
		--menuHoverFg: #fff;
		--menuHoverBg: #ff4242;
		--menuActiveFg: #fff;
		--menuActiveBg: #d42e2e;
	}

	&.radio {
		--menuActiveFg: var(--MI_THEME-accent);
		--menuActiveBg: var(--MI_THEME-accentedBg);
	}

	&.parent {
		--menuActiveFg: var(--MI_THEME-accent);
		--menuActiveBg: var(--MI_THEME-accentedBg);
	}

	&.label {
		pointer-events: none;
		font-size: 0.7em;
		padding-bottom: 4px;
	}

	&.pending {
		pointer-events: none;
		opacity: 0.7;
	}

	&.none {
		pointer-events: none;
		opacity: 0.7;
	}
}

.item_content {
	width: 100%;
	max-width: 100vw;
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	text-overflow: ellipsis;
}

.item_content_text {
	max-width: calc(100vw - 4rem);
	text-overflow: ellipsis;
	overflow: hidden;
}

.switchButton {
	margin-left: -2px;
	--height: 1.35em;
}

.switchText {
	margin-left: 8px;
	overflow: hidden;
	text-overflow: ellipsis;
}

.icon {
	margin-right: 8px;
	line-height: 1;
}

.caret {
	margin-left: auto;
}

.avatar {
	margin-right: 5px;
	width: 20px;
	height: 20px;
}

.indicator {
	display: flex;
	align-items: center;
	color: var(--MI_THEME-indicator);
	font-size: 12px;
}

.divider {
	margin: 8px 0;
	border-top: solid 0.5px var(--MI_THEME-divider);
}

.radioIcon {
	display: inline-block;
	position: relative;
	width: 1em;
	height: 1em;
	vertical-align: -0.125em;
	border-radius: 50%;
	border: solid 2px var(--MI_THEME-divider);
	background-color: var(--MI_THEME-panel);

	&.radioChecked {
		border-color: var(--MI_THEME-accent);

		&::after {
			content: "";
			display: block;
			position: absolute;
			top: 50%;
			left: 50%;
			transform: translate(-50%, -50%);
			width: 50%;
			height: 50%;
			border-radius: 50%;
			background-color: var(--MI_THEME-accent);
		}
	}
}
</style>
