<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" preferType="dialog" zPriority="high" :returnFocusTo="returnFocusTo" @click="closeViewer" @esc="closeViewer" @closed="emit('closed')">
	<div :class="$style.root">
		<div :class="$style.header" class="_acrylic">
			<div :class="$style.title">
				<MkCondensedLine :minScale="0.5">{{ title ?? url }}</MkCondensedLine>
			</div>
			<a
				:class="$style.headerButton"
				class="_button"
				:href="url"
				target="_blank"
				rel="nofollow noopener"
				:aria-label="i18n.ts.openInNewTab"
				:title="i18n.ts.openInNewTab"
			>
				<i class="ti ti-external-link"></i>
			</a>
			<button
				:class="$style.headerButton"
				class="_button"
				:aria-label="i18n.ts.close"
				:title="i18n.ts.close"
				@click="closeViewer"
			>
				<i class="ti ti-x"></i>
			</button>
		</div>
		<div :class="$style.player">
			<MkExternalPlayer v-if="playerShowing" :player="player" :title="title"/>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import type { SummalyResult } from '@misskey-dev/summaly';
import MkModal from '@/components/MkModal.vue';
import MkExternalPlayer from '@/components/MkExternalPlayer.vue';
import { i18n } from '@/i18n.js';

const props = defineProps<{
	player: SummalyResult['player'];
	title?: string | null;
	url: string;
	returnFocusTo?: HTMLElement | null;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const modal = useTemplateRef('modal');
const playerShowing = ref(true);
const aspectRatio = computed(() => {
	if (props.player.width == null || props.player.height == null || props.player.width <= 0 || props.player.height <= 0) {
		return 16 / 9;
	}

	return props.player.width / props.player.height;
});

function closeViewer() {
	if (!playerShowing.value) return;

	playerShowing.value = false;
	modal.value?.close();
	if (window.location.hash === '#external-player') {
		window.history.back();
	}
}

function onPopState() {
	if (!playerShowing.value) return;

	playerShowing.value = false;
	modal.value?.close();
}

onMounted(() => {
	window.history.pushState(null, '', '#external-player');
	window.addEventListener('popstate', onPopState);
});

onBeforeUnmount(() => {
	window.removeEventListener('popstate', onPopState);
});
</script>

<style lang="scss" module>
.root {
	width: min(100%, calc((100dvh - 108px) * v-bind("aspectRatio")));
	margin: auto;
	overflow: hidden;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.header {
	display: flex;
	align-items: center;
	height: 44px;
}

.title {
	flex: 1;
	min-width: 0;
	padding: 0 12px;
	overflow: hidden;
}

.headerButton {
	display: grid;
	flex-shrink: 0;
	width: 44px;
	height: 44px;
	place-items: center;
	color: inherit;

	&:focus-visible {
		outline: 2px solid var(--MI_THEME-focus);
		outline-offset: -2px;
	}
}

.player {
	width: 100%;
	aspect-ratio: v-bind("aspectRatio");
	background: var(--MI_THEME-bg);
}
</style>
