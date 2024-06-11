<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div ref="rootEl" :class="$style.root">
	<div v-if="!showing" :class="$style.placeholder"></div>
	<slot v-else></slot>
</div>
</template>

<script lang="ts" setup>
import { nextTick, onMounted, onActivated, onBeforeUnmount, ref, shallowRef } from 'vue';

const rootEl = shallowRef<HTMLDivElement>();
const showing = ref(false);

const observer = new IntersectionObserver(
	(entries) => {
		if (entries.some((entry) => entry.isIntersecting)) {
			showing.value = true;
		}
	},
);

onMounted(() => {
	nextTick(() => {
		observer.observe(rootEl.value!);
	});
});

onActivated(() => {
	nextTick(() => {
		observer.observe(rootEl.value!);
	});
});

onBeforeUnmount(() => {
	observer.disconnect();
});
</script>

<style lang="scss" module>
.root {
	display: block;
}

.placeholder {
	display: block;
	min-height: 150px;
}
</style>
