<template>
<div class="nvemkhtwcnnpkdrwfcbzuwhfulejhmzg" :class="{ round, primary }">
	<button @click="$emit('click')">
		<slot></slot>
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		round: {
			type: Boolean,
			required: false,
			default: false
		},
		primary: {
			type: Boolean,
			required: false,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

root(isDark)
	display inline-block

	& + .nvemkhtwcnnpkdrwfcbzuwhfulejhmzg
		margin-left 12px

	> button
		display inline-block
		margin 0
		padding 12px 20px
		font-size 14px
		border 1px solid isDark ? #6d727d : #dcdfe6
		border-radius 4px
		outline none
		box-shadow none
		color isDark ? #fff : #606266
		transition 0.1s

		&:hover
		&:focus
			color $theme-color
			background rgba($theme-color, isDark ? 0.2 : 0.12)
			border-color rgba($theme-color, isDark ? 0.5 : 0.3)

		&:active
			color darken($theme-color, 20%)
			background rgba($theme-color, 0.12)
			border-color $theme-color
			transition all 0s

	&.primary
		> button
			border 1px solid $theme-color
			background $theme-color
			color $theme-color-foreground

			&:hover
			&:focus
				background lighten($theme-color, 20%)
				border-color lighten($theme-color, 20%)

			&:active
				background darken($theme-color, 20%)
				border-color darken($theme-color, 20%)
				transition all 0s

	&.round
		> button
			border-radius 64px

.nvemkhtwcnnpkdrwfcbzuwhfulejhmzg[data-darkmode]
	root(true)

.nvemkhtwcnnpkdrwfcbzuwhfulejhmzg:not([data-darkmode])
	root(false)

</style>
