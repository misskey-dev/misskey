<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div :class="$style.tabsRoot">
		<button
			v-for="option in tabs"
			:key="option.key"
			:class="['_button', $style.tabButton, { [$style.active]: modelValue === option.key }]"
			:disabled="modelValue === option.key"
			@click="update(option.key)"
		>
			<i v-if="option.icon" :class="[option.icon, $style.icon]"></i>
			{{ option.label }}
		</button>
	</div>
</template>

<script lang="ts">
export type Tab<T = string> = {
	key: T;
	icon?: string;
	label?: string;
};
</script>

<script setup lang="ts" generic="const T extends Tab">
import { defineProps, defineEmits } from 'vue';

defineProps<{
	tabs: T[];
}>();

const model = defineModel<T['key']>();

function update(key: T['key']) {
	model.value = key;
}
</script>

<style module lang="scss">
.tabsRoot {
	display: flex;
	font-size: 90%;
}

.tabButton {
	flex: 1;
	padding: 10px 8px;
	border-radius: 999px;

	&:disabled {
		opacity: 1 !important;
		cursor: default;
	}

	&.active {
		color: var(--MI_THEME-accent);
		background: var(--MI_THEME-accentedBg);
	}

	&:not(.active):hover {
		color: var(--MI_THEME-fgHighlighted);
		background: var(--MI_THEME-panelHighlight);
	}

	&:not(:first-child) {
		margin-left: 8px;
	}

	> .icon {
		margin-right: 6px;
	}
}

@container (max-width: 500px) {
	.tabsRoot {
		font-size: 80%;
	}

	.tabButton {
		padding: 11px 8px;
	}
}
</style>
