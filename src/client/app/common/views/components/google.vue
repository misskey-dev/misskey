<template>
<div class="mk-google">
	<input type="search" v-model="query" :placeholder="q">
	<button @click="search"><fa icon="search"/> {{ $t('@.search') }}</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n(),
	props: ['q'],
	data() {
		return {
			query: null
		};
	},
	mounted() {
		this.query = this.q;
	},
	methods: {
		search() {
			const engine = this.$store.state.settings.webSearchEngine ||
				'https://www.google.com/?#q={{query}}';
			const url = engine.replace('{{query}}', this.query)
			window.open(url, '_blank');
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-google
	display flex
	margin 8px 0

	> input
		flex-shrink 1
		padding 10px
		width 100%
		height 40px
		font-size 16px
		color var(--googleSearchFg)
		background var(--googleSearchBg)
		border solid 1px var(--googleSearchBorder)
		border-radius 4px 0 0 4px

		&:hover
			border-color var(--googleSearchHoverBorder)

	> button
		flex-shrink 0
		padding 0 16px
		border solid 1px var(--googleSearchBorder)
		border-left none
		border-radius 0 4px 4px 0

		&:hover
			background-color var(--googleSearchHoverButton)

		&:active
			box-shadow 0 2px 4px rgba(#000, 0.15) inset

</style>
