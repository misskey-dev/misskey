<template>
<div class="mk-widget-container" :class="{ naked }">
	<header :class="{ withGradient }" v-if="showHeader">
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
	},
	computed: {
		withGradient(): boolean {
			return (this as any).os.isSignedIn
				? (this as any).os.i.clientSettings.gradientWindowHeader != null
					? (this as any).os.i.clientSettings.gradientWindowHeader
					: false
				: false;
		}
	}
});
</script>

<style lang="stylus" scoped>
.mk-widget-container
	background #fff
	border solid 1px rgba(0, 0, 0, 0.075)
	border-radius 6px
	overflow hidden

	&.naked
		background transparent !important
		border none !important

	> header
		> .title
			z-index 1
			margin 0
			padding 0 16px
			line-height 42px
			font-size 0.9em
			font-weight bold
			color #888
			box-shadow 0 1px rgba(0, 0, 0, 0.07)

			> [data-fa]
				margin-right 4px

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
			color #ccc

			&:hover
				color #aaa

			&:active
				color #999

		&.withGradient
			> .title
				background linear-gradient(to bottom, #fff, #ececec)
				box-shadow 0 1px rgba(#000, 0.11)
</style>
