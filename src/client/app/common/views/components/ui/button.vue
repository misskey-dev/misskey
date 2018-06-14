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
	},
	data() {
		return {
			styl: 'fill'
		};
	},
	inject: ['isCardChild'],
	created() {
		if (this.isCardChild) {
			this.styl = 'line';
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark, fill)
	> button
		display block
		width 100%
		margin 0
		padding 0
		font-weight bold
		font-size 16px
		line-height 44px
		border none
		border-radius 6px
		outline none
		box-shadow none

		if fill
			color $theme-color-foreground
			background $theme-color

			&:hover
				background lighten($theme-color, 5%)

			&:active
				background darken($theme-color, 5%)
		else
			color $theme-color
			background none

			&:hover
				color darken($theme-color, 5%)

			&:active
				background rgba($theme-color, 0.3)

.ui-button[data-darkmode]
	&.fill
		root(true, true)
	&:not(.fill)
		root(true, false)

.ui-button:not([data-darkmode])
	&.fill
		root(false, true)
	&:not(.fill)
		root(false, false)

</style>
