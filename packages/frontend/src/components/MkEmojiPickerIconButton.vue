<template>
<button
	class="_button item"
	tabindex="0"
	:title="title"
>
	<MkCustomEmoji v-if="isCustomEmoji" class="emoji" :name="emojiStr" :normal="true"/>
	<MkEmoji v-else class="emoji" :emoji="emojiStr" :normal="true"/>
</button>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import * as Misskey from 'misskey-js';
import { getEmojiName } from '@/scripts/emojilist';

const props = defineProps<{
	emoji: string | Misskey.entities.CustomEmoji
}>();

const isCustomEmoji = computed(() => {
	return typeof props.emoji !== 'string' || props.emoji[0] === ':';
});

const emojiStr = computed(() => {
	return typeof props.emoji === 'string' ? props.emoji : props.emoji.name;
});

const title = computed(() => {
	if (isCustomEmoji.value) {
		return emojiStr.value;
	} else {
		return getEmojiName(emojiStr.value) ?? emojiStr.value;
	}
});
</script>
