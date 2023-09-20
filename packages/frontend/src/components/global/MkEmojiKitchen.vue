<template>
<span v-if="errored">{{ alt }}</span>
<img v-else :class="[$style.root, { [$style.normal]: normal, [$style.noStyle]: noStyle }]" :src="url" :alt="alt" :title="alt" decoding="async" @error="errored = true" @load="errored = false"/>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

const props = defineProps<{
	name: string;
	normal?: boolean;
	url: string;
}>();

const rawUrl = computed(() => props.url);

const url = computed(() => rawUrl.value);

const alt = computed(() => props.name);
let errored = $ref(url.value == null);
</script>

<style lang="scss" module>
.root {
	height: 2em;
	vertical-align: middle;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.2);
	}
}

.normal {
	height: 1.25em;
	vertical-align: -0.25em;

	&:hover {
		transform: none;
	}
}

.noStyle {
	height: auto !important;
}
</style>
