<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root]">
	<div :inert="disabled" :class="[{ [$style.disabled]: disabled }]">
		<slot></slot>
	</div>
	<div v-if="disabled" :class="[$style.cover]"></div>
</div>
</template>

<script lang="ts" setup>
defineProps<{
	disabled?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	position: relative;
}

.disabled {
	opacity: 0.3;
	filter: saturate(0.5);
}

.cover {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	cursor: not-allowed;
	--color: light-dark(rgba(0, 0, 0, 0.05), rgba(255, 255, 255, 0.05));
	background-size: auto auto;
	background-image: repeating-linear-gradient(135deg, transparent, transparent 10px, var(--color) 4px, var(--color) 14px);
}
</style>
