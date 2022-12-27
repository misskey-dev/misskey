<template>
<img v-if="customEmoji" class="mk-emoji custom" :class="{ normal, noStyle }" :src="url" :alt="alt" :title="alt" decoding="async"/>
<img v-else-if="char && !useOsNativeEmojis" class="mk-emoji" :src="url" :alt="alt" decoding="async" @pointerenter="computeTitle"/>
<span v-else-if="char && useOsNativeEmojis" :alt="alt" @pointerenter="computeTitle">{{ char }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { CustomEmoji } from 'misskey-js/built/entities';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { char2twemojiFilePath, char2fluentEmojiFilePath } from '@/scripts/emoji-base';
import { defaultStore } from '@/store';
import { instance } from '@/instance';
import { getEmojiName } from '@/scripts/emojilist';

const props = defineProps<{
	emoji: string;
	normal?: boolean;
	noStyle?: boolean;
	customEmojis?: CustomEmoji[];
	isReaction?: boolean;
}>();

const char2path = defaultStore.state.emojiStyle === 'twemoji' ? char2twemojiFilePath : char2fluentEmojiFilePath;

const isCustom = computed(() => props.emoji.startsWith(':'));
const char = computed(() => isCustom.value ? undefined : props.emoji);
const useOsNativeEmojis = computed(() => defaultStore.state.emojiStyle === 'native' && !props.isReaction);
const ce = computed(() => props.customEmojis ?? instance.emojis ?? []);
const customEmoji = computed(() => isCustom.value ? ce.value.find(x => x.name === props.emoji.substr(1, props.emoji.length - 2)) : undefined);
const url = computed(() => {
	if (char.value) {
		return char2path(char.value);
	} else {
		const rawUrl = (customEmoji.value as CustomEmoji).url;
		return defaultStore.state.disableShowingAnimatedImages
			? getStaticImageUrl(rawUrl)
			: rawUrl;
	}
});
const alt = computed(() => customEmoji.value ? `:${customEmoji.value.name}:` : char.value);

// Searching from an array with 2000 items for every emoji felt like too energy-consuming, so I decided to do it lazily on pointerenter
function computeTitle(event: PointerEvent): void {
	const title = customEmoji.value
		? `:${customEmoji.value.name}:`
		: (getEmojiName(char.value as string) ?? char.value as string);
	(event.target as HTMLElement).title = title;
}
</script>

<style lang="scss" scoped>
.mk-emoji {
	height: 1.25em;
	vertical-align: -0.25em;

	&.custom {
		height: 2.5em;
		vertical-align: middle;
		transition: transform 0.2s ease;

		&:hover {
			transform: scale(1.2);
		}

		&.normal {
			height: 1.25em;
			vertical-align: -0.25em;

			&:hover {
				transform: none;
			}
		}
	}

	&.noStyle {
		height: auto !important;
	}
}
</style>
