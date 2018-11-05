<template>
<img class="mk-emoji" :src="url" :alt="alt || name" :title="name">
</template>

<script lang="ts">
import Vue from 'vue';
import { lib } from 'emojilib';
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
			this.name = emoji || raw;
			this.url = !raw && customEmojis && customEmojis.length ? customEmojis.find(e => e.name === emoji || e.aliases && e.aliases.includes(emoji)).url : null;
			if (!this.url) {
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
