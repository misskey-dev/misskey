<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<a ref="el" :href="to" target="_blank" rel="noopener">
	<slot></slot>
</a>
</template>

<script lang="ts" setup>
import { computed, inject, shallowRef } from 'vue';

const props = withDefaults(defineProps<{
	to: string;
	activeClass?: null | string;
}>(), {
	activeClass: null,
});

const el = shallowRef<HTMLElement>();

defineExpose({ $el: el });
</script>
