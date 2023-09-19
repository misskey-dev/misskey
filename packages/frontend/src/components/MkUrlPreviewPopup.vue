<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.root" :style="{ zIndex, top: top + 'px', left: left + 'px' }">
	<Transition :name="defaultStore.state.animation ? '_transition_zoom' : ''" @afterLeave="emit('closed')">
		<MkUrlPreview v-if="showing" class="_popup _shadow" :url="url" :showActions="false"/>
	</Transition>
</div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import MkUrlPreview from '@/components/MkUrlPreview.vue';
import * as os from '@/os.js';
import { defaultStore } from '@/store.js';

const props = defineProps<{
	showing: boolean;
	url: string;
	source: HTMLElement;
}>();

const emit = defineEmits<{
	(ev: 'closed'): void;
}>();

const zIndex = os.claimZIndex('middle');
let top = $ref(0);
let left = $ref(0);

onMounted(() => {
	const rect = props.source.getBoundingClientRect();
	const x = Math.max((rect.left + (props.source.offsetWidth / 2)) - (300 / 2), 6) + window.pageXOffset;
	const y = rect.top + props.source.offsetHeight + window.pageYOffset;

	top = y;
	left = x;
});
</script>

<style lang="scss" module>
.root {
	position: absolute;
	width: 500px;
	max-width: calc(90vw - 12px);
	pointer-events: none;
}
</style>
