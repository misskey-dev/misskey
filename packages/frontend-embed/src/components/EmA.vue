<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a :href="to" target="_blank" rel="noopener">
	<slot></slot>
</a>
</template>

<script lang="ts" setup>
import { } from 'vue';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
}>(), {
	activeClass: null,
});
</script>
