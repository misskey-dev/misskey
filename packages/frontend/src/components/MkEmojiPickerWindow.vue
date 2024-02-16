<!--
SPDX-FileCopyrightText: syuilo and misskey-project
SPDX-License-Identifier: AGPL-3.0-only
-->

<template>
<MkWindow
	ref="window"
	:initialWidth="300"
	:initialHeight="290"
	:canResize="true"
	:mini="true"
	:front="true"
	@closed="emit('closed')"
>
	<MkEmojiPicker :showPinned="showPinned" :asReactionPicker="asReactionPicker" :targetNote="targetNote" asWindow :class="$style.picker" @chosen="chosen"/>
</MkWindow>
</template>

<script lang="ts" setup>
import { } from 'vue';
import * as Misskey from 'misskey-js';
import MkWindow from '@/components/MkWindow.vue';
import MkEmojiPicker from '@/components/MkEmojiPicker.vue';

withDefaults(defineProps<{
	src?: HTMLElement;
	showPinned?: boolean;
	asReactionPicker?: boolean;
	targetNote?: Misskey.entities.Note
}>(), {
	showPinned: true,
});

const emit = defineEmits<{
	(ev: 'chosen', v: any): void;
	(ev: 'closed'): void;
}>();

function chosen(emoji: any) {
	emit('chosen', emoji);
}
</script>

<style lang="scss" module>
.picker {
	height: 100%;
}
</style>
