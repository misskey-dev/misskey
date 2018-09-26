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

root(isDark)
	> [data-fa]
		display block
		position absolute
		top 0
		left 0
		width 48px
		text-align center
		line-height 48px
		color #9eaba8
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
		background rgba(#000, 0.05)
		outline none
		//border solid 1px #ddd
		border none
		border-radius 16px
		transition color 0.5s ease, border 0.5s ease
		color isDark ? #fff : #000

		&::placeholder
			color #9eaba8

		&:hover
			background isDark ? rgba(#fff, 0.04) : rgba(#000, 0.08)

		&:focus
			box-shadow 0 0 0 2px var(--primaryAlpha05) !important

.search[data-darkmode]
	root(true)

.search:not([data-darkmode])
	root(false)
</style>
