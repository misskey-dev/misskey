<template>
<div class="mk-widget-container" :class="{ naked }">
	<header v-if="showHeader">
		<div class="title"><slot name="header"></slot></div>
		<slot name="func"></slot>
	</header>
	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		showHeader: {
			type: Boolean,
			default: true
		},
		naked: {
			type: Boolean,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-widget-container
	background var(--face)
	box-shadow var(--shadow)
	border-radius var(--round)
	overflow hidden

	&.naked
		background transparent !important
		box-shadow none !important

	> header
		background var(--faceHeader)

		> .title
			z-index 1
			margin 0
			padding 0 16px
			line-height 42px
			font-size 0.9em
			font-weight bold
			color var(--faceHeaderText)
			box-shadow 0 1px rgba(#000, 0.07)

			> [data-fa]
				margin-right 6px

			&:empty
				display none

		> button
			position absolute
			z-index 2
			top 0
			right 0
			padding 0
			width 42px
			font-size 0.9em
			line-height 42px
			color var(--faceTextButton)

			&:hover
				color var(--faceTextButtonHover)

			&:active
				color var(--faceTextButtonActive)

</style>
