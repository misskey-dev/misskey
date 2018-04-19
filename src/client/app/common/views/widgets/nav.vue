<template>
<div class="mkw-nav">
	<mk-widget-container>
		<div class="mkw-nav--body">
			<mk-nav/>
		</div>
	</mk-widget-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'nav'
});
</script>

<style lang="stylus" scoped>
root(isDark)
	.mkw-nav--body
		padding 16px
		font-size 12px
		color isDark ? #9aa4b3 : #aaa
		background isDark ? #282c37 : #fff

		a
			color isDark ? #9aa4b3 : #999

		i
			color isDark ? #9aa4b3 : #ccc

.mkw-nav[data-darkmode]
	root(true)

.mkw-nav:not([data-darkmode])
	root(false)

</style>
