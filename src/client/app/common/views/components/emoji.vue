<template>
<img class="mk-emoji" :src="url" :alt="alt || name" :title="name">
</template>

<script lang="ts">
import Vue from 'vue';
import { lib } from 'emojilib';

const findCustomEmoji = (x, emoji) =>
	x.name === emoji ||
	x.aliases && x.aliases.includes(emoji);

export default Vue.extend({
	props: {
		emoji: {
			type: String,
			required: false
		},
		raw: {
			type: String,
			required: false
		},
		customEmojis: {
			required: false
		}
	},
	data() {
		return {
			url: null,
			alt: null,
			name: null
		}
	},
	mounted() {
		this.$nextTick(() => this.exec());
	},
	methods: {
		exec() {
			const { emoji, raw, customEmojis } = this;
			this.name = emoji ? `:${emoji}:` : raw;
			if (!raw && customEmojis && customEmojis.length) {
				this.url = customEmojis.find(x => findCustomEmoji(x, emoji)).url;
			} else { // *MEM: `customEmojis` always has a emoji named `emoji`
				const char = raw || lib[emoji] && lib[emoji].char;
				if (char) {
					this.url = `https://twemoji.maxcdn.com/2/svg/${char.codePointAt(0).toString(16)}.svg`;
					this.alt = char;
				}
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-emoji
	height 2.5em
	vertical-align middle
</style>
