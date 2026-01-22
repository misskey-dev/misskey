<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="{ [$style.vertical]: vertical }">
	<div :class="$style.label">
		<slot name="label"></slot>
	</div>

	<div :class="$style.body">
		<div
			v-for="option in options"
			:key="getKey(option.value)"
			v-adaptive-border
			:class="[$style.optionRoot, { [$style.disabled]: option.disabled, [$style.checked]: model === option.value }]"
			:aria-checked="model === option.value"
			:aria-disabled="option.disabled"
			role="checkbox"
			@click="toggle(option)"
		>
			<input
				type="radio"
				:disabled="option.disabled"
				:class="$style.optionInput"
			>
			<span :class="$style.optionButton">
				<span></span>
			</span>
			<div :class="$style.optionContent">
				<i v-if="option.icon" :class="[$style.optionIcon, option.icon]" :style="option.iconStyle"></i>
				<div>
					<slot v-if="option.slotId != null" :name="`option-${option.slotId as SlotNames}`"></slot>
					<template v-else>
						<div :style="option.labelStyle">{{ option.label ?? option.value }}</div>
						<div v-if="option.caption" :class="$style.optionCaption">{{ option.caption }}</div>
					</template>
				</div>
			</div>
		</div>
	</div>

	<div :class="$style.caption">
		<slot name="caption"></slot>
	</div>
</div>
</template>

<script lang="ts">
import type { StyleValue } from 'vue';
import type { OptionValue } from '@/types/option-value.js';

export type MkRadiosOption<T = OptionValue, S = string> = {
	value: T;
	slotId?: S;
	label?: string;
	labelStyle?: StyleValue;
	icon?: string;
	iconStyle?: StyleValue;
	caption?: string;
	disabled?: boolean;
};
</script>

<script setup lang="ts" generic="const T extends MkRadiosOption">
defineProps<{
	options: T[];
	vertical?: boolean;
}>();

type SlotNames = NonNullable<T extends MkRadiosOption<any, infer U> ? U : never>;

defineSlots<{
	label?: () => void;
	caption?: () => void;
} & {
	[K in `option-${SlotNames}`]: () => void;
}>();

const model = defineModel<T['value']>({ required: true });

function getKey(value: OptionValue): PropertyKey {
	if (value === null) return '___null___';
	return value;
}

function toggle(o: MkRadiosOption): void {
	if (o.disabled) return;
	model.value = o.value;
}
</script>

<style lang="scss" module>
.label {
	font-size: 0.85em;
	padding: 0 0 8px 0;
	user-select: none;

	&:empty {
		display: none;
	}
}

.body {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
}

.caption {
	font-size: 0.85em;
	padding: 8px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);

	&:empty {
		display: none;
	}
}

.vertical > .body {
	flex-direction: column;
}

.optionRoot {
	position: relative;
	display: inline-flex;
	align-items: center;
	text-align: left;
	cursor: pointer;
	padding: 8px 10px;
	min-width: 60px;
	background-color: var(--MI_THEME-panel);
	background-clip: padding-box !important;
	border: solid 1px var(--MI_THEME-panel);
	border-radius: 6px;
	font-size: 90%;
	transition: all 0.2s;
	user-select: none;

	&.disabled {
		opacity: 0.6;
		cursor: not-allowed !important;
	}

	&:hover {
		border-color: var(--MI_THEME-inputBorderHover) !important;
	}

	&:focus-within {
		outline: none;
		box-shadow: 0 0 0 2px var(--MI_THEME-focus);
	}

	&.checked {
		background-color: var(--MI_THEME-accentedBg) !important;
		border-color: var(--MI_THEME-accentedBg) !important;
		color: var(--MI_THEME-accent);
		cursor: default !important;

		.optionButton {
			border-color: var(--MI_THEME-accent);

			&::after {
				background-color: var(--MI_THEME-accent);
				transform: scale(1);
				opacity: 1;
			}
		}

		.optionCaption {
			color: color(from var(--MI_THEME-accent) srgb r g b / 0.75);
		}
	}
}

.optionInput {
	position: absolute;
	width: 0;
	height: 0;
	opacity: 0;
	margin: 0;
}

.optionButton {
	position: relative;
	display: inline-block;
	width: 14px;
	height: 14px;
	background: none;
	border: solid 2px var(--MI_THEME-inputBorder);
	border-radius: 100%;
	transition: inherit;

	&::after {
		content: '';
		display: block;
		position: absolute;
		top: 3px;
		right: 3px;
		bottom: 3px;
		left: 3px;
		border-radius: 100%;
		opacity: 0;
		transform: scale(0);
		transition: 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
	}
}

.optionContent {
	display: flex;
	align-items: center;
	gap: 6px;
	margin-left: 8px;
}

.optionCaption {
	font-size: 0.85em;
	padding: 2px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
	transition: all 0.2s;
}

.optionIcon {
	flex-shrink: 0;
}
</style>
