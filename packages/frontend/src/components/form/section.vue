<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, { [$style.rootFirst]: first }]">
	<div :class="[$style.label, { [$style.labelFirst]: first }]"><slot name="label"></slot></div>
	<div :class="[$style.description]"><slot name="description"></slot></div>
	<div :class="$style.main">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts" setup>
defineProps<{
	first?: boolean;
}>();
</script>

<style lang="scss" module>
.root {
	border-top: solid 0.5px var(--divider);
	//border-bottom: solid 0.5px var(--divider);
}

.rootFirst {
	border-top: none;
}

.label {
	font-weight: bold;
	padding: 1.5em 0 0 0;
	margin: 0 0 8px 0;

	&:empty {
		display: none;
	}
}

.labelFirst {
	padding-top: 0;
}

.main {
	margin: 1.5em 0 0 0;
}

.description {
	font-size: 0.85em;
	color: var(--fgTransparentWeak);
	margin: 0 0 8px 0;
}
</style>
