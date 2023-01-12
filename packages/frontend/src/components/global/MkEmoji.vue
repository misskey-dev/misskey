<template>
<img v-if="isCustom" :class="[$style.root, $style.custom, { [$style.normal]: normal, [$style.noStyle]: noStyle }]" :src="url" :alt="alt" :title="alt" decoding="async"/>
<img v-else-if="char && !useOsNativeEmojis" :class="$style.root" :src="url" :alt="alt" decoding="async" @pointerenter="computeTitle"/>
<span v-else-if="char && useOsNativeEmojis" :alt="alt" @pointerenter="computeTitle">{{ char }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { getStaticImageUrl } from '@/scripts/media-proxy';
import { char2twemojiFilePath, char2fluentEmojiFilePath } from '@/scripts/emoji-base';
import { defaultStore } from '@/store';
import { getEmojiName } from '@/scripts/emojilist';

const props = defineProps<{
	emoji: string;
	normal?: boolean;
	noStyle?: boolean;
	isReaction?: boolean;
	host?: string | null;
}>();

const char2path = defaultStore.state.emojiStyle === 'twemoji' ? char2twemojiFilePath : char2fluentEmojiFilePath;

const isCustom = computed(() => props.emoji.startsWith(':'));
const customEmojiName = props.emoji.substr(1, props.emoji.length - 2);
const char = computed(() => isCustom.value ? undefined : props.emoji);
const useOsNativeEmojis = computed(() => defaultStore.state.emojiStyle === 'native' && !props.isReaction);
const url = computed(() => {
	if (char.value) {
		return char2path(char.value);
	} else {
		const rawUrl = props.host ? `/emoji/${customEmojiName}@${props.host}.webp` : `/emoji/${customEmojiName}.webp`;
		return defaultStore.state.disableShowingAnimatedImages
			? getStaticImageUrl(rawUrl)
			: rawUrl;
	}
});
const alt = computed(() => isCustom.value ? `:${customEmojiName}:` : char.value);

// Searching from an array with 2000 items for every emoji felt like too energy-consuming, so I decided to do it lazily on pointerenter
function computeTitle(event: PointerEvent): void {
	const title = isCustom.value
		? `:${customEmojiName}:`
		: (getEmojiName(char.value as string) ?? char.value as string);
	(event.target as HTMLElement).title = title;
}
</script>

<style lang="scss" module>
.root {
	height: 1.25em;
	vertical-align: -0.25em;
}

.custom {
	height: 2.5em;
	vertical-align: middle;
	transition: transform 0.2s ease;

	&:hover {
		transform: scale(1.2);
	}
}

.normal {
	height: 1.25em;
	vertical-align: -0.25em;

	&:hover {
		transform: none;
	}
}

.noStyle {
	height: auto !important;
}
</style>
