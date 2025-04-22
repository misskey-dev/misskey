<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkModal ref="modal" :zPriority="'middle'" :preferType="'dialog'" @closed="$emit('closed')" @click="onBgClick">
	<div ref="rootEl" :class="$style.root">
		<div :class="$style.header">
			<span :class="$style.icon">
				<i class="ti ti-info-circle"></i>
			</span>
			<span :class="$style.title"><MkSparkle>{{ i18n.ts.misskeyUpdated }}</MkSparkle></span>
		</div>
		<div :class="$style.text">
			<iframe
				ref="frameEl"
				scrolling="no"
				:src="`${IFRAME_ORIGIN}/_app_changelog/web.html${flags}`"
				:class="$style.frame"
			></iframe>
		</div>
		<div :class="$style.footer">
			<MkButton primary full @click="ok">{{ i18n.ts.ok }}</MkButton>
		</div>
	</div>
</MkModal>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from 'vue';
import MkModal from '@/components/MkModal.vue';
import MkButton from '@/components/MkButton.vue';
import MkSparkle from '@/components/MkSparkle.vue';
import { i18n } from '@/i18n.js';
import { store } from '@/store.js';
import { confetti } from '@/utility/confetti.js';

const IFRAME_ORIGIN = 'https://docs.misskey.flowers';
const flags = _DEV_ ? '?dev=true' : '';

const rootEl = useTemplateRef('rootEl');
const modal = useTemplateRef('modal');
const frameEl = useTemplateRef('frameEl');

async function ok() {
	modal.value?.close();
}

function onBgClick() {
	rootEl.value?.animate([{
		offset: 0,
		transform: 'scale(1)',
	}, {
		offset: 0.5,
		transform: 'scale(1.1)',
	}, {
		offset: 1,
		transform: 'scale(1)',
	}], {
		duration: 100,
	});
}

const frameHeight = ref(300);

function onFrameMessage(ev: MessageEvent) {
	if (ev.origin !== IFRAME_ORIGIN) return;
	switch (ev.data.type) {
		case 'ready': {
			const theme = getComputedStyle(window.document.documentElement);

			frameEl.value?.contentWindow?.postMessage({
				type: 'theme',
				theme: {
					fg: theme.getPropertyValue('--MI_THEME-fg'),
					fgHighlighted: theme.getPropertyValue('--MI_THEME-fgHighlighted'),
					fgOnAccent: theme.getPropertyValue('--MI_THEME-fgOnAccent'),
					accent: theme.getPropertyValue('--MI_THEME-accent'),
					divider: theme.getPropertyValue('--MI_THEME-divider'),
				},
			}, IFRAME_ORIGIN);
			break;
		}
		case 'resize':
			frameHeight.value = ev.data.height;
			break;
	}
}

onMounted(() => {
	window.addEventListener('message', onFrameMessage);
	confetti({
		duration: 1000 * 3,
	});

	watch(store.r.darkMode, () => {
		const theme = getComputedStyle(window.document.documentElement);

		frameEl.value?.contentWindow?.postMessage({
			type: 'theme',
			theme: {
				fg: theme.getPropertyValue('--MI_THEME-fg'),
				fgHighlighted: theme.getPropertyValue('--MI_THEME-fgHighlighted'),
				fgOnAccent: theme.getPropertyValue('--MI_THEME-fgOnAccent'),
				accent: theme.getPropertyValue('--MI_THEME-accent'),
				divider: theme.getPropertyValue('--MI_THEME-divider'),
			},
		}, IFRAME_ORIGIN);
	}, { flush: 'post' });
});

onBeforeUnmount(() => {
	window.removeEventListener('message', onFrameMessage);
});
</script>

<style lang="scss" module>
.root {
	margin: auto;
	position: relative;
	padding: 24px 24px 0;
	width: 100%;
	max-width: 480px;
	max-height: 100%;
	overflow: hidden;
	overflow-y: auto;
	overflow-x: hidden;
	box-sizing: border-box;
	background: var(--MI_THEME-panel);
	border-radius: var(--MI-radius);
}

.header {
	font-size: 120%;
}

.icon {
	margin-right: 0.5em;
}

.title {
	font-weight: bold;
}

.text {
	margin: 1em 0;
}

.frame {
	width: 100%;
	height: v-bind("frameHeight + 'px'");
	border: none;
	background: transparent;
	color-scheme: light dark;
	overflow: hidden;
}

@media (pointer: coarse) {
	.frame {
		pointer-events: none;
	}
}

.footer {
	position: sticky;
	bottom: 0;
	left: -24px;
	background-color: color(from var(--MI_THEME-bg) srgb r g b / 0.8);
	margin: 0 -24px;
	padding: 18px 24px;
}
</style>
