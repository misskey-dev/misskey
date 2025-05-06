<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]" class="_gaps_m">
	<img v-if="type === 'empty' && instance.infoImageUrl" :src="instance.infoImageUrl" draggable="false" :class="$style.img"/>
	<svg v-else-if="type === 'empty'" :class="$style.icon" viewBox="0 0 128 128" style="stroke-linecap:round;">
		<path d="M64,0C99.323,0 128,28.677 128,64C128,99.323 99.323,128 64,128C28.677,128 0,99.323 0,64C0,28.677 28.677,0 64,0ZM64,8C33.093,8 8,33.093 8,64C8,94.907 33.093,120 64,120C94.907,120 120,94.907 120,64C120,33.093 94.907,8 64,8Z" style="fill:currentColor;"/>
		<g transform="matrix(1,0,0,1,0,8)">
			<path d="M64,88L64,48" style="fill:none;stroke:currentColor;stroke-width:8px;"/>
		</g>
		<g transform="matrix(1,0,0,1,-4,4)">
			<circle cx="68" cy="28" r="4" style="fill:currentColor;"/>
		</g>
	</svg>
	<img v-if="type === 'notFound' && instance.notFoundImageUrl" :src="instance.notFoundImageUrl" draggable="false" :class="$style.img"/>
	<svg v-else-if="type === 'notFound'" :class="$style.icon" viewBox="0 0 128 128" style="stroke-linecap:round;">
		<path d="M64,0C99.323,0 128,28.677 128,64C128,99.323 99.323,128 64,128C28.677,128 0,99.323 0,64C0,28.677 28.677,0 64,0ZM64,8C33.093,8 8,33.093 8,64C8,94.907 33.093,120 64,120C94.907,120 120,94.907 120,64C120,33.093 94.907,8 64,8Z" style="fill:currentColor;"/>
		<g transform="matrix(1,0,0,1,0,8)">
			<path d="M64,72L64,56C72.533,55.777 80,49.333 80,40C80,31.667 73.333,24 64,24C55.667,24 47.556,31.667 48,40" style="fill:none;stroke:currentColor;stroke-width:8px;"/>
		</g>
		<g transform="matrix(1,0,0,1,-4,68)">
			<circle cx="68" cy="28" r="4" style="fill:currentColor;"/>
		</g>
	</svg>

	<div style="opacity: 0.7;">{{ props.text ?? (type === 'empty' ? i18n.ts.nothing : type === 'notFound' ? i18n.ts.notFound : null) }}</div>
	<slot></slot>
</div>
</template>

<script lang="ts" setup>
import {} from 'vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	type: 'empty' | 'notFound' | 'error';
	text?: string;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
	text-align: center;
	padding: 32px;
}

.img {
	vertical-align: bottom;
	height: 128px;
	margin-bottom: 16px;
	border-radius: 16px;
}

.icon {
	width: 64px;
	height: 64px;
	margin: 0 auto;
	color: var(--MI_THEME-accent);
}
</style>
