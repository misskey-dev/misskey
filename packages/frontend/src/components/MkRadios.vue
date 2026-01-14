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
		<MkRadio
			v-for="option in options"
			:key="getKey(option.value)"
			v-model="model"
			:disabled="option.disabled"
			:value="option.value"
		>
			<div :class="[$style.optionContent, { [$style.checked]: model === option.value }]">
				<i v-if="option.icon" :class="[$style.optionIcon, option.icon]" :style="option.iconStyle"></i>
				<div>
					<slot v-if="option.slotId != null" :name="`option-${option.slotId as SlotNames}`"></slot>
					<template v-else>
						<div :style="option.labelStyle">{{ option.label ?? option.value }}</div>
						<div v-if="option.caption" :class="$style.optionCaption">{{ option.caption }}</div>
					</template>
				</div>
			</div>
		</MkRadio>
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
import MkRadio from './MkRadio.vue';

defineProps<{
	options: T[];
	vertical?: boolean;
}>();

type SlotNames = NonNullable<T extends MkRadiosOption<any, infer U> ? U : never>;

defineSlots<{
	label?: () => any;
	caption?: () => any;
} & {
	[K in `option-${SlotNames}`]: () => any;
}>();

const model = defineModel<T['value']>({ required: true });

function getKey(value: OptionValue): PropertyKey {
	if (value === null) return 'null';
	return value;
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

.optionContent {
	display: flex;
	align-items: center;
	gap: 6px;
}

.optionCaption {
	font-size: 0.85em;
	padding: 2px 0 0 0;
	color: color(from var(--MI_THEME-fg) srgb r g b / 0.75);
}

.optionContent.checked {
	.optionCaption {
		color: color(from var(--MI_THEME-accent) srgb r g b / 0.75);
	}
}

.optionIcon {
	flex-shrink: 0;
}

.vertical > .body {
	flex-direction: column;
}
</style>
