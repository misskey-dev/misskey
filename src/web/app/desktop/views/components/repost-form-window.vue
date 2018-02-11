<template>
<mk-window ref="window" is-modal @closed="$destroy">
	<span slot="header" :class="$style.header">%fa:retweet%%i18n:desktop.tags.mk-repost-form-window.title%</span>
	<div slot="content">
		<mk-repost-form ref="form" :post="post" @posted="$refs.window.close" @canceled="$refs.window.close"/>
	</div>
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
		}
	}
});
</script>

<style lang="stylus" module>
.header
	> [data-fa]
		margin-right 4px

</style>
