<!--
SPDX-FileCopyrightText: syuilo and other misskey contributors
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<code :class="$style.root">{{ code }}</code>
</template>

<script lang="ts" setup>
const props = defineProps<{
	code: string;
}>();
</script>

<style module lang="scss">
.root {
	display: inline-block;
	font-family: Consolas, Monaco, Andale Mono, Ubuntu Mono, monospace;
	overflow-wrap: anywhere;
	color: #D4D4D4;
	background: #1E1E1E;
	padding: .1em;
	border-radius: .3em;
}
</style>
