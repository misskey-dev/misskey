<template>
<div class="ui-button">
	<button :type="type">
		<slot></slot>
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		type: {
			type: String,
			required: false
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.ui-button
	> button
		display block
		width 100%
		margin 0
		padding 0
		color $theme-color-foreground
		font-weight bold
		font-size 16px
		line-height 44px
		background $theme-color
		border none
		border-radius 6px
		outline none
		box-shadow none

		&:hover
			background lighten($theme-color, 5%)

		&:active
			background darken($theme-color, 5%)

</style>
