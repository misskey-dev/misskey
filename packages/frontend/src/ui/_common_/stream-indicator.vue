<template>
<div v-if="hasDisconnected && defaultStore.state.serverDisconnectedBehavior === 'quiet'" :class="$style.root" class="_panel _shadow" @click="resetDisconnected">
	<div><i class="ti ti-alert-triangle"></i> {{ i18n.ts.disconnectedFromServer }}</div>
	<div :class="$style.command" class="_buttons">
		<MkButton :class="$style.commandButton" small primary @click="reload">{{ i18n.ts.reload }}</MkButton>
		<MkButton :class="$style.commandButton" small>{{ i18n.ts.doNothing }}</MkButton>
	</div>
</div>
</template>

<script lang="ts" setup>
import { onUnmounted } from 'vue';
import { stream } from '@/stream';
import { i18n } from '@/i18n';
import MkButton from '@/components/MkButton.vue';
import * as os from '@/os';
import { defaultStore } from '@/store';

const zIndex = os.claimZIndex('high');

let hasDisconnected = $ref(false);

function onDisconnected() {
	hasDisconnected = true;
}

function resetDisconnected() {
	hasDisconnected = false;
}

function reload() {
	location.reload();
}

stream.on('_disconnected_', onDisconnected);

onUnmounted(() => {
	stream.off('_disconnected_', onDisconnected);
});
</script>

<style lang="scss" module>
.root {
	position: fixed;
	z-index: v-bind(zIndex);
	bottom: calc(var(--minBottomSpacing) + var(--margin));
	right: var(--margin);
	margin: 0;
	padding: 12px;
	font-size: 0.9em;
	max-width: 320px;
}

.command {
	margin-top: 8px;
}

.commandButton {
}
</style>
