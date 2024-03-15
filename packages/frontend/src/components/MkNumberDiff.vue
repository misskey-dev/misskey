<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span class="ceaaebcd" :class="{ [$style.isPlus]: isPlus, [$style.isMinus]: isMinus, [$style.isZero]: isZero }">
	<slot name="before"></slot>{{ isPlus ? '+' : '' }}{{ number(value) }}<slot name="after"></slot>
</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import number from '@/filters/number.js';

const props = defineProps<{
	value: number;
}>();

const isPlus = computed(() => props.value > 0);
const isMinus = computed(() => props.value < 0);
const isZero = computed(() => props.value === 0);
</script>

<style lang="scss" module>
.isPlus {
	color: var(--success);
}

.isMinus {
	color: var(--error);
}

.isZero {
	opacity: 0.5;
}
</style>
