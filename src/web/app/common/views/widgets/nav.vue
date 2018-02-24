<template>
<div class="mkw-nav">
	<mk-widget-container>
		<div :class="$style.body">
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

<style lang="stylus" module>
.body
	padding 16px
	font-size 12px
	color #aaa
	background #fff

	a
		color #999

	i
		color #ccc

</style>
