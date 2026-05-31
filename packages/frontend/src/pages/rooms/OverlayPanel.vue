<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.isMobile]: isMobile, [$style.isDesktop]: !isMobile }]">
	<MkStickyContainer>
		<template #header>
			<div :class="$style.header">
				<span :class="$style.icon">
					<slot name="icon"></slot>
				</span>

				<span :class="$style.title">
					<MkCondensedLine :minScale="0.5">{{ title }}</MkCondensedLine>
				</span>

				<button class="_button" :class="$style.close" @click="emit('close')">
					<i class="ti ti-x"></i>
				</button>
			</div>
		</template>

		<div :class="$style.body">
			<slot></slot>
		</div>
	</MkStickyContainer>
</div>
</template>

<script lang="ts" setup>
import { computed, defineAsyncComponent, nextTick, onMounted, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue';

const props = defineProps<{
	title: string;
	isMobile: boolean;
	acrylic?: boolean;
}>();

const emit = defineEmits<{
	(ev: 'close'): void;
}>();

</script>

<style lang="scss" module>
.root.isDesktop {
	position: absolute;
	top: 16px;
	right: 16px;
	z-index: 1;
	width: 350px;
	max-height: calc(100% - 16px - 16px);
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	border-radius: 12px;
	background: var(--MI_THEME-panel);
}

.root.isMobile {
	position: absolute;
	bottom: 0;
	left: 0;
	z-index: 1;
	width: 100%;
	height: min(50%, 400px);
	box-sizing: border-box;
	overflow: auto;
	overscroll-behavior: contain;
	border-radius: 16px 16px 0 0;
	background: var(--MI_THEME-panel);
}

.header {
	display: flex;
	align-items: center;
	position: relative;
	padding-left: 16px;
	background: var(--MI_THEME-panel);
	border-bottom: solid 0.5px var(--MI_THEME-divider);
}

.icon {
	margin-right: 12px;
}

.title {
	flex: 1;
	min-width: 0;
	font-weight: bold;
	text-overflow: ellipsis;
	overflow: hidden;
}

.close {
	margin-left: auto;
	width: 45px;
	aspect-ratio: 1;
	display: grid;
	place-items: center;
}

.body {
	padding: 16px;
}
</style>
