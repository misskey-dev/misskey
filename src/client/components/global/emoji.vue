<template>
<img v-if="customEmoji" class="mk-emoji custom" :class="{ normal, noStyle }" :src="url" :alt="alt" :title="alt"/>
<img v-else-if="char && !useOsNativeEmojis" class="mk-emoji" :src="url" :alt="alt" :title="alt"/>
<span v-else-if="char && useOsNativeEmojis">{{ char }}</span>
<span v-else>{{ emoji }}</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getStaticImageUrl } from '@/scripts/get-static-image-url';
import { twemojiSvgBase } from '@/../misc/twemoji-base';

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
			required: false,
			default: () => []
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
			return this.$pizzax.state.useOsNativeEmojis && !this.isReaction;
		},

		ce() {
			let ce = [];
			if (this.customEmojis) ce = ce.concat(this.customEmojis);
			if (this.$store.state.instance.meta && this.$store.state.instance.meta.emojis) ce = ce.concat(this.$store.state.instance.meta.emojis);
			return ce;
		}
	},

	watch: {
		ce: {
			handler() {
				if (this.isCustom) {
					const customEmoji = this.ce.find(x => x.name === this.emoji.substr(1, this.emoji.length - 2));
					if (customEmoji) {
						this.customEmoji = customEmoji;
						this.url = this.$pizzax.state.disableShowingAnimatedImages
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
			let codes = Array.from(this.char).map(x => x.codePointAt(0).toString(16));
			if (!codes.includes('200d')) codes = codes.filter(x => x != 'fe0f');
			codes = codes.filter(x => x && x.length);

			this.url = `${twemojiSvgBase}/${codes.join('-')}.svg`;
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
