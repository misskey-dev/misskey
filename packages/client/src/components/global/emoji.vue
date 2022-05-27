<template>
<img v-if="customEmoji" class="mk-emoji custom" :class="{ normal, noStyle }" :src="url" :alt="alt" :title="alt" decoding="async"/>
<img v-else-if="char && !useOsNativeEmojis" class="mk-emoji" :src="url" :alt="alt" :title="alt" decoding="async"/>
<span v-else-if="char && useOsNativeEmojis">{{ char }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { twemojiSvgBase } from '@/scripts/twemoji-base';
import { defaultStore } from '@/store';
import { instance } from '@/instance';

export default defineComponent({
	props: {
		emoji: {
			type: String,
			required: true
		},
		normal: {
			type: Boolean,
			required: false,
			default: false
		},
		noStyle: {
			type: Boolean,
			required: false,
			default: false
		},
		customEmojis: {
			required: false
		},
		isReaction: {
			type: Boolean,
			default: false
		},
	},

	setup(props) {
		const isCustom = computed(() => props.emoji.startsWith(':'));
		const char = computed(() => isCustom.value ? null : props.emoji);
		const useOsNativeEmojis = computed(() => defaultStore.state.useOsNativeEmojis && !props.isReaction);
		const ce = computed(() => props.customEmojis || instance.emojis || []);
		const customEmoji = computed(() => isCustom.value ? ce.value.find(x => x.name === props.emoji.substr(1, props.emoji.length - 2)) : null);
		const url = computed(() => {
			if (char.value) {
				let codes = Array.from(char.value).map(x => x.codePointAt(0).toString(16));
				if (!codes.includes('200d')) codes = codes.filter(x => x !== 'fe0f');
				codes = codes.filter(x => x && x.length);
				return `${twemojiSvgBase}/${codes.join('-')}.svg`;
			} else {
				return defaultStore.state.disableShowingAnimatedImages
					? getStaticImageUrl(customEmoji.value.url)
					: customEmoji.value.url;
			}
		});
		const alt = computed(() => customEmoji.value ? `:${customEmoji.value.name}:` : char.value);

		return {
			url,
			char,
			alt,
			customEmoji,
			useOsNativeEmojis,
		};
	},
});
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
