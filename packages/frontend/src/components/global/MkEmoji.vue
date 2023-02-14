<template>
<img v-if="!useOsNativeEmojis" :class="$style.root" :src="url" :alt="props.emoji" decoding="async" @pointerenter="computeTitle"/>
<span v-else-if="useOsNativeEmojis" :alt="props.emoji" @pointerenter="computeTitle">{{ props.emoji }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { char2twemojiFilePath, char2fluentEmojiFilePath } from '@/scripts/emoji-base';
import { defaultStore } from '@/store';
import { getEmojiName } from '@/scripts/emojilist';

const props = defineProps<{
	emoji: string;
}>();

const char2path = defaultStore.state.emojiStyle === 'twemoji' ? char2twemojiFilePath : char2fluentEmojiFilePath;

const useOsNativeEmojis = computed(() => defaultStore.state.emojiStyle === 'native');
const url = computed(() => {
	return char2path(props.emoji);
});

// Searching from an array with 2000 items for every emoji felt like too energy-consuming, so I decided to do it lazily on pointerenter
function computeTitle(event: PointerEvent): void {
	const title = getEmojiName(props.emoji as string) ?? props.emoji as string;
	(event.target as HTMLElement).title = title;
}
</script>

<style lang="scss" module>
.root {
	height: 1.25em;
	vertical-align: -0.25em;
}
</style>
