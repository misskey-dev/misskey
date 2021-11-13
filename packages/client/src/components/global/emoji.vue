<template>
<img v-if="customEmoji" class="mk-emoji custom" :class="{ normal, noStyle }" :src="url" :alt="alt" :title="alt" decoding="async"/>
<img v-else-if="char && !useOsNativeEmojis" class="mk-emoji" :src="url" :alt="alt" :title="alt" decoding="async"/>
<span v-else-if="char && useOsNativeEmojis">{{ char }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { char2file } from '@/scripts/twemoji-base';

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

	data() {
		return {
			url: null,
			char: null,
			customEmoji: null
		}
	},

	computed: {
		isCustom(): boolean {
			return this.emoji.startsWith(':');
		},

		alt(): string {
			return this.customEmoji ? `:${this.customEmoji.name}:` : this.char;
		},

		useOsNativeEmojis(): boolean {
			return this.$store.state.useOsNativeEmojis && !this.isReaction;
		},

		ce() {
			return this.customEmojis || this.$instance?.emojis || [];
		}
	},

	watch: {
		ce: {
			handler() {
				if (this.isCustom) {
					const customEmoji = this.ce.find(x => x.name === this.emoji.substr(1, this.emoji.length - 2));
					if (customEmoji) {
						this.customEmoji = customEmoji;
						this.url = this.$store.state.disableShowingAnimatedImages
							? getStaticImageUrl(customEmoji.url)
							: customEmoji.url;
					}
				}
			},
			immediate: true
		},
	},

	created() {
		if (!this.isCustom) {
			this.char = this.emoji;
		}

		if (this.char) {
			this.url = char2file(this.char);
		}
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
