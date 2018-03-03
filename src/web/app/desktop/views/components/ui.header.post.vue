<template>
<div class="post">
	<button @click="post" title="%i18n:desktop.tags.mk-ui-header-post-button.post%">%fa:pencil-alt%</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	methods: {
		post() {
			(this as any).apis.post();
		}
	}
});
</script>

<style lang="stylus" scoped>
@import '~const.styl'

.post
	display inline-block
	padding 8px
	height 100%
	vertical-align top

	> button
		display inline-block
		margin 0
		padding 0 10px
		height 100%
		font-size 1.2em
		font-weight normal
		text-decoration none
		color $theme-color-foreground
		background $theme-color !important
		outline none
		border none
		border-radius 4px
		transition background 0.1s ease
		cursor pointer

		*
			pointer-events none

		&:hover
			background lighten($theme-color, 10%) !important

		&:active
			background darken($theme-color, 10%) !important
			transition background 0s ease

</style>
