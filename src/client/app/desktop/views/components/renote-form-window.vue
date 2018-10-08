<template>
<mk-window ref="window" is-modal @closed="onWindowClosed" :animation="animation">
	<span slot="header" :class="$style.header">%fa:retweet%%i18n:@title%</span>
	<mk-renote-form ref="form" :note="note" @posted="onPosted" @canceled="onCanceled" v-hotkey.global="keymap"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		note: {
			type: Object,
			required: true
		},

		animation: {
			type: Boolean,
			required: false,
			default: true
		}
	},

	computed: {
		keymap(): any {
			return {
				'esc': this.close,
				'enter': this.post,
				'q': this.quote,
			};
		}
	},

	methods: {
		post() {
			(this.$refs.form as any).ok();
		},
		quote() {
			(this.$refs.form as any).onQuote();
		},
		close() {
			(this.$refs.window as any).close();
		},
		onPosted() {
			(this.$refs.window as any).close();
		},
		onCanceled() {
			(this.$refs.window as any).close();
		},
		onWindowClosed() {
			this.$emit('closed');
			this.destroyDom();
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

</style>
