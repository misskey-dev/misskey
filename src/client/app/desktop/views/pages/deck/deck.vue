<template>
<mk-ui :class="$style.root">
	<div class="qlvquzbjribqcaozciifydkngcwtyzje">
		<x-column src="home"/>
		<x-column src="home"/>
		<x-column src="home"/>
		<x-column src="home"/>
	</div>
</mk-ui>
</template>

<script lang="ts">
import Vue from 'vue';
import XColumn from './deck.column.vue';

export default Vue.extend({
	components: {
		XColumn
	}
});
</script>

<style lang="stylus" module>
.root
	height 100vh
</style>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display flex
	flex 1
	padding 16px 0 16px 16px
	overflow auto

.qlvquzbjribqcaozciifydkngcwtyzje[data-darkmode]
	root(true)

.qlvquzbjribqcaozciifydkngcwtyzje:not([data-darkmode])
	root(false)

</style>
