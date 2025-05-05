<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="root" :class="[$style.root]" class="_gaps">
	<i v-if="type === 'empty'" class="ti ti-info-circle" :class="$style.icon"></i>
	<div>{{ props.text }}</div>
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import {} from 'vue';

const props = defineProps<{
	type: 'empty' | 'notFound' | 'error';
	text: string;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
	text-align: center;
	padding: 32px;
}

.icon {
	font-size: 24px;
}
</style>
