<template>
<mk-window ref="window" is-modal @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:retweet%%i18n:desktop.tags.mk-repost-form-window.title%</span>
	<mk-repost-form ref="form" :post="post" @posted="onPosted" @canceled="onCanceled"/>
</mk-window>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: ['post'],
	mounted() {
		document.addEventListener('keydown', this.onDocumentKeydown);
	},
	beforeDestroy() {
		document.removeEventListener('keydown', this.onDocumentKeydown);
	},
	methods: {
		onDocumentKeydown(e) {
			if (e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA') {
				if (e.which == 27) { // Esc
					(this.$refs.window as any).close();
				}
			}
		},
		onPosted() {
			(this.$refs.window as any).close();
		},
		onCanceled() {
			(this.$refs.window as any).close();
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

</style>
