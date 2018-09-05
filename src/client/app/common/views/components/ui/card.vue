<template>
<div class="ui-card">
	<header>
		<slot name="title"></slot>
	</header>

	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	provide() {
		return {
			isCardChild: true
		};
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	margin 16px
	color isDark ? #fff : #000
	background isDark ? #282C37 : #fff
	box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

	> header
		padding 16px
		font-weight bold
		font-size 20px
		color isDark ? #fff : #444

		@media (min-width 500px)
			padding 24px 32px

	> section
		padding 20px 16px
		border-top solid 1px isDark ? rgba(#000, 0.3) : rgba(#000, 0.1)

		@media (min-width 500px)
			padding 32px

		&.fit-top
			padding-top 0

		> header
			margin-bottom 16px
			font-weight bold
			color isDark ? #fff : #444

.ui-card[data-darkmode]
	root(true)

.ui-card:not([data-darkmode])
	root(false)

</style>
