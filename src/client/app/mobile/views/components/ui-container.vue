<template>
<div class="ukygtjoj" :class="{ naked, hideHeader: !showHeader }">
	<header v-if="showHeader">
		<div class="title"><slot name="header"></slot></div>
		<slot name="func"></slot>
	</header>
	<div v-show="showBody">
		<slot></slot>
	</div>
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
.ukygtjoj
	background var(--face)
	border-radius 8px
	box-shadow 0 4px 16px rgba(#000, 0.1)
	overflow hidden

	&.naked
		background transparent !important
		box-shadow none !important

	> header
		> .title
			margin 0
			padding 8px 10px
			font-size 15px
			font-weight normal
			color var(--faceHeaderText)
			background var(--faceHeader)
			border-radius 8px 8px 0 0

			> [data-icon]
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
			color var(--faceTextButton)

</style>
