<template>
<form class="search" @submit.prevent="onSubmit">
	%fa:search%
	<input v-model="q" type="search" placeholder="%i18n:@placeholder%"/>
	<div class="result"></div>
</form>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	data() {
		return {
			q: ''
		};
	},
	methods: {
		onSubmit() {
			if (this.q.startsWith('#')) {
				this.$router.push(`/tags/${encodeURIComponent(this.q.substr(1))}`);
			} else {
				this.$router.push(`/search?q=${encodeURIComponent(this.q)}`);
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.search
	@media (max-width 800px)
		display none !important

	> [data-fa]
		display block
		position absolute
		top 0
		left 0
		width 48px
		text-align center
		line-height 48px
		color var(--desktopHeaderFg)
		pointer-events none

		> *
			vertical-align middle

	> input
		user-select text
		cursor auto
		margin 8px 0 0 0
		padding 6px 18px 6px 36px
		width 14em
		height 32px
		font-size 1em
		background var(--desktopHeaderSearchBg)
		outline none
		border none
		border-radius 16px
		transition color 0.5s ease, border 0.5s ease
		color var(--desktopHeaderSearchFg)

		@media (max-width 1000px)
			width 10em

		&::placeholder
			color var(--desktopHeaderFg)

		&:hover
			background var(--desktopHeaderSearchHoverBg)

		&:focus
			box-shadow 0 0 0 2px var(--primaryAlpha05) !important

</style>
