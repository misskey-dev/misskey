<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div
	class="default" :style="[
		marginTopBottom ? { marginTop: marginTopBottom, marginBottom: marginTopBottom } : {},
		marginLeftRight ? { marginLeft: marginLeftRight, marginRight: marginLeftRight } : {},
		borderStyle ? { borderStyle: borderStyle } : {},
		borderWidth ? { borderWidth: borderWidth } : {},
		borderColor ? { borderColor: borderColor } : {},
	]"
/>
</template>

<script setup lang="ts">
defineProps<{
	marginTopBottom?: string;
	marginLeftRight?: string;
	borderStyle?: string;
	borderWidth?: string;
	borderColor?: string;
}>();
</script>

<style scoped lang="scss">
.default {
	border-top: solid 0.5px var(--divider);
}
</style>
