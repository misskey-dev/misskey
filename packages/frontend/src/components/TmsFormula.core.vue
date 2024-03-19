<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
	<div v-if="props.displayMode" :class="$style.mathBlockRoot">
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div :class="$style.mathBlockInner" v-html="rawHtml"></div>
	</div>
	<!-- eslint-disable-next-line vue/no-v-html -->
	<span v-else v-html="rawHtml"></span>
	</template>

	<script lang="ts" setup>
	import { computed } from 'vue';
	import katex from 'katex';

	const props = defineProps<{
		formula: string;
		displayMode: boolean;
	}>();

	const rawHtml = computed(() => {
		return katex.renderToString(props.formula, {
			throwOnError: false,
			displayMode: props.displayMode,
		});
	});
	</script>

	<style>
	@import "../../node_modules/katex/dist/katex.min.css";
	</style>

	<style lang="scss" module>
	.mathBlockRoot {
		display: block;
		overflow-wrap: anywhere;
		background: var(--bg);
		padding: 0 1em;
		margin: 0.5em 0;
		overflow: auto;
		border-radius: 8px;
	}

	.mathBlockInner {
		display: block;
		margin: auto;
		width: fit-content;
		overflow: hidden; // fallback (overflow: clip)
		overflow: clip;
	}
	</style>
