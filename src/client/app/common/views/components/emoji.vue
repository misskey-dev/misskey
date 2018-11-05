<template>
<img v-if="customEmoji" class="fvgwvorwhxigeolkkrcderjzcawqrscl custom" :src="url" :alt="alt" :title="alt"/>
<img v-else-if="char && !useOsDefaultEmojis" class="fvgwvorwhxigeolkkrcderjzcawqrscl" :src="url" :alt="alt" :title="alt"/>
<span v-else-if="char && useOsDefaultEmojis">{{ char }}</span>
<span v-else>:{{ name }}:</span>
</template>

<script lang="ts">
import Vue from 'vue';
import { lib } from 'emojilib';

export default Vue.extend({
	props: {
		name: {
			type: String,
			required: false
		},
		emoji: {
			type: String,
			required: false
		},
		customEmojis: {
			required: false,
			default: []
		}
	},

	data() {
		return {
			url: null,
			char: null,
			customEmoji: null
		}
	},

	computed: {
		alt(): string {
			return this.customEmoji ? `:${this.customEmoji.name}:` : this.char;
		},

		useOsDefaultEmojis(): boolean {
			return this.$store.state.device.useOsDefaultEmojis;
		}
	},

	created() {
		if (this.name) {
			const customEmoji = this.customEmojis.find(x => x.name == this.name);
			if (customEmoji) {
				this.customEmoji = customEmoji;
				this.url = customEmoji.url;
			} else {
				const emoji = lib[this.name];
				if (emoji) {
					this.char = emoji.char;
				}
			}
		} else {
			this.char = this.emoji;
		}

		if (this.char) {
			this.url = `https://twemoji.maxcdn.com/2/svg/${this.char.codePointAt(0).toString(16)}.svg`;
		}
	}
});
</script>

<style lang="stylus" scoped>
.fvgwvorwhxigeolkkrcderjzcawqrscl
	height 1em

	&.custom
		height 2.5em
		vertical-align middle

</style>
