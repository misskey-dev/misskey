<template>
<img class="mk-emoji" :src="url" :alt="alt || name" :title="name">
</template>

<script lang="ts">
import Vue from 'vue';
import { lib } from 'emojilib';
export default Vue.extend({
	props: ['emoji'],
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
			const { emoji } = this;
			this.name = emoji;
			(this as any).api('meta').then(meta =>
				this.url = meta && meta.emojis ? meta.emojis.find(e => e.name === emoji || e.aliases && e.aliases.includes(emoji)).url : null);
			if (!this.url) {
				const { char } = lib[emoji] || { char: null };
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
