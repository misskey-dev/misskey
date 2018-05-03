<template>
<div class="mk-google">
	<input type="search" v-model="query" :placeholder="q">
	<button @click="search">検索</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
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
			window.open(`https://www.google.com/?#q=${this.query}`, '_blank');
		}
	}
});
</script>

<style lang="stylus" scoped>
root(isDark)
	display flex
	margin 8px 0

	> input
		flex-shrink 1
		padding 10px
		width 100%
		height 40px
		font-family sans-serif
		font-size 16px
		color isDark ? #dee4e8 : #55595c
		background isDark ? #191b22 : #fff
		border solid 1px isDark ? #495156 : #dadada
		border-radius 4px 0 0 4px

		&:hover
			border-color isDark ? #777c86 : #b0b0b0

	> button
		flex-shrink 0
		padding 0 16px
		border solid 1px isDark ? #495156 : #dadada
		border-left none
		border-radius 0 4px 4px 0

		&:hover
			background-color isDark ? #2e3440 : #eee

		&:active
			box-shadow 0 2px 4px rgba(#000, 0.15) inset

.mk-google[data-darkmode]
	root(true)

.mk-google:not([data-darkmode])
	root(false)

</style>
