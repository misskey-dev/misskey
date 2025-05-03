<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<div :class="[$style.root, accented ? $style.accented : null]"></div>
</template>

<script lang="ts" setup>
const props = withDefaults(defineProps<{
	accented?: boolean;
}>(), {
	accented: false,
});
</script>

<style lang="scss" module>
.root {
	--c: var(--MI_THEME-divider);

	&.accented {
		--c: var(--MI_THEME-accent);
		opacity: 0.5;
	}

	--dot-size: 2px;
	--gap-size: 40px;
	--offset: calc(var(--gap-size) / 2);

	height: 200px;
	margin-bottom: -200px;

	background-image: linear-gradient(transparent 60%, transparent 100%), radial-gradient(var(--c) var(--dot-size), transparent var(--dot-size)), radial-gradient(var(--c) var(--dot-size), transparent var(--dot-size));
	background-position: 0 0, 0 0, var(--offset) var(--offset);
	background-size: 100% 100%, var(--gap-size) var(--gap-size), var(--gap-size) var(--gap-size);
	mask-image: linear-gradient(to bottom, black 0%, transparent 100%);
	pointer-events: none;
}
</style>
