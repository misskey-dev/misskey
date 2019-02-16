<template>
<div class="mkw-nav">
	<ui-container>
		<div class="mkw-nav--body">
			<mk-nav/>
		</div>
	</ui-container>
</div>
</template>

<script lang="ts">
import define from '../../../common/define-widget';
export default define({
	name: 'nav'
});
</script>

<style lang="stylus" scoped>
.mkw-nav
	.mkw-nav--body
		padding 16px
		font-size 12px
		color var(--text)
		background var(--face)

		a
			color var(--text)

		i
			color var(--text)

</style>
