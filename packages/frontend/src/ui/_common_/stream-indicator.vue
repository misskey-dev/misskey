<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div v-if="hasDisconnected && prefer.s.serverDisconnectedBehavior === 'quiet'" :class="$style.root" class="_panel _shadow" @click="resetDisconnected">
	<div><i class="ti ti-alert-triangle"></i> {{ i18n.ts.disconnectedFromServer }}</div>
	<div :class="$style.command" class="_buttons">
		<MkButton small primary @click="reload">{{ i18n.ts.reload }}</MkButton>
		<MkButton small>{{ i18n.ts.doNothing }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted, ref, watch } from 'vue';
import type * as Misskey from 'misskey-js';
import { useStream } from '@/stream.js';
import { i18n } from '@/i18n.js';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os.js';
import { prefer } from '@/preferences.js';
import { store } from '@/store.js';

const zIndex = os.claimZIndex('high');

let stream: Misskey.IStream | null = null;
const hasDisconnected = ref(false);
let timeoutId: number | null = null;

function onDisconnected() {
	if (timeoutId != null) window.clearTimeout(timeoutId);
	timeoutId = window.setTimeout(() => {
		hasDisconnected.value = true;
	}, 5000);
}

function resetDisconnected() {
	if (timeoutId != null) window.clearTimeout(timeoutId);
	timeoutId = null;
	hasDisconnected.value = false;
}

function reload() {
	window.location.reload();
}

function setStreamListener() {
	if (stream != null) return;
	stream = useStream();
	stream.on('_connected_', resetDisconnected);
	stream.on('_disconnected_', onDisconnected);
}

function removeStreamListener() {
	resetDisconnected();
	if (stream == null) return;
	stream.off('_connected_', resetDisconnected);
	stream.off('_disconnected_', onDisconnected);
	stream = null;
}

watch(store.r.realtimeMode, (enabled) => {
	if (enabled) {
		setStreamListener();
	} else {
		removeStreamListener();
	}
}, { immediate: true });

onUnmounted(removeStreamListener);
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: calc(var(--MI-minBottomSpacing) + var(--MI-margin));
	right: var(--MI-margin);
	margin: 0;
	padding: 12px;
	font-size: 0.9em;
	max-width: 320px;
}

.command {
	margin-top: 8px;
}
</style>
