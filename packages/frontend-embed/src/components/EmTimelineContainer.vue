<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="$style.timelineRoot">
	<div v-if="showHeader" :class="$style.header"><slot name="header"></slot></div>
	<div :class="$style.body"><slot name="body"></slot></div>
</div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
	showHeader?: boolean;
}>(), {
	showHeader: true,
});
</script>

<style module lang="scss">
.timelineRoot {
	background-color: var(--MI_THEME-panel);
	height: 100%;
	max-height: var(--embedMaxHeight, none);
	display: flex;
	flex-direction: column;
}

.header {
	flex-shrink: 0;
	border-bottom: 1px solid var(--MI_THEME-divider);
}

.body {
	flex-grow: 1;
	overflow-y: auto;
}
</style>
