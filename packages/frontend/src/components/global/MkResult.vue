<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<Transition :name="prefer.s.animation ? '_transition_zoom' : ''" appear>
	<div :class="[$style.root, { [$style.warn]: type === 'notFound', [$style.error]: type === 'error' }]" class="_gaps_m">
		<img v-if="type === 'empty' && instance.infoImageUrl" :src="instance.infoImageUrl" draggable="false" :class="$style.img"/>
		<svg v-else-if="type === 'empty'" :class="$style.icon" viewBox="0 0 128 128" style="stroke-linecap:round;">
			<g transform="matrix(1,0,0,0.9,0,12.8)">
				<path d="M64,88L64,48" style="fill:none;stroke:currentColor;stroke-width:8.41px;"/>
			</g>
			<g transform="matrix(1,0,0,1,-4,8)">
				<circle cx="68" cy="28" r="4" style="fill:currentColor;"/>
			</g>
			<g transform="matrix(0.875,0,0,0.875,8,8)">
				<circle cx="64" cy="64" r="64" style="fill:none;stroke:currentColor;stroke-width:9.14px;"/>
			</g>
		</svg>
		<img v-if="type === 'notFound' && instance.notFoundImageUrl" :src="instance.notFoundImageUrl" draggable="false" :class="$style.img"/>
		<svg v-else-if="type === 'notFound'" :class="$style.icon" viewBox="0 0 128 128" style="stroke-linecap:round;">
			<g transform="matrix(1,0,0,1,0,12)">
				<path d="M64,64L64,56C72.533,55.777 80,49.333 80,40C80,31.667 73.333,24 64,24C55.667,24 47.556,31.667 48,40" style="fill:none;stroke:currentColor;stroke-width:8px;"/>
			</g>
			<g transform="matrix(1,0,0,1,-4,64)">
				<circle cx="68" cy="28" r="4" style="fill:currentColor;"/>
			</g>
			<g transform="matrix(0.875,0,0,0.875,8,8)">
				<circle cx="64" cy="64" r="64" style="fill:none;stroke:currentColor;stroke-width:9.14px;"/>
			</g>
		</svg>
		<img v-if="type === 'error' && instance.serverErrorImageUrl" :src="instance.serverErrorImageUrl" draggable="false" :class="$style.img"/>
		<svg v-else-if="type === 'error'" :class="$style.icon" viewBox="0 0 128 128" style="stroke-linecap:round;">
			<g transform="matrix(0.707107,0.707107,-0.636396,0.636396,62.0201,-24.5298)">
				<path d="M64,94.667L64,41.333" style="fill:none;stroke:currentColor;stroke-width:8.41px;"/>
			</g>
			<g transform="matrix(0.707107,-0.707107,0.636396,0.636396,-24.5298,65.9799)">
				<path d="M64,94.667L64,41.333" style="fill:none;stroke:currentColor;stroke-width:8.41px;"/>
			</g>
			<g transform="matrix(0.875,0,0,0.875,8,8)">
				<circle cx="64" cy="64" r="64" style="fill:none;stroke:currentColor;stroke-width:9.14px;"/>
			</g>
		</svg>

		<div style="opacity: 0.7;">{{ props.text ?? (type === 'empty' ? i18n.ts.nothing : type === 'notFound' ? i18n.ts.notFound : type === 'error' ? i18n.ts.somethingHappened : null) }}</div>
		<slot></slot>
	</div>
</Transition>
</template>

<script lang="ts" setup>
import {} from 'vue';
import { instance } from '@/instance.js';
import { i18n } from '@/i18n.js';
import { prefer } from '@/preferences.js';

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

	&.error {
		.icon {
			color: var(--MI_THEME-error);
		}
	}

	&.warn {
		.icon {
			color: var(--MI_THEME-warn);
		}
	}
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
