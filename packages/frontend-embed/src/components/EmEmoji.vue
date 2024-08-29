<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<span :alt="props.emoji">{{ colorizedNativeEmoji }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { colorizeEmoji } from 'frontend-shared/emojilist.js';

const props = defineProps<{
	emoji: string;
	menu?: boolean;
	menuReaction?: boolean;
}>();

const colorizedNativeEmoji = computed(() => colorizeEmoji(props.emoji));
</script>

<style lang="scss" module>
.root {
	height: 1.25em;
	vertical-align: -0.25em;
}
</style>
