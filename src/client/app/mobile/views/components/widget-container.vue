<template>
<div class="mk-widget-container" :class="{ naked, hideHeader: !showHeader }">
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
root(isDark)
	background isDark ? #21242f : #eee
	border-radius 8px
	box-shadow 0 4px 16px rgba(#000, 0.1)
	overflow hidden

	&.naked
		background transparent !important
		box-shadow none !important

	&.hideHeader
		background isDark ? #21242f : #fff

	> header
		> .title
			margin 0
			padding 8px 10px
			font-size 15px
			font-weight normal
			color isDark ? #b8c5cc : #465258
			background isDark ? #282c37 : #fff
			border-radius 8px 8px 0 0

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
			height 100%
			font-size 15px
			color #465258

.mk-widget-container[data-darkmode]
	root(true)

.mk-widget-container:not([data-darkmode])
	root(false)

</style>
