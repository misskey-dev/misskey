<template>
<div class="kedshtep" :class="{ naked, inDeck }">
	<header v-if="showHeader">
		<div class="title"><slot name="header"></slot></div>
		<slot name="func"></slot>
		<button v-if="bodyTogglable" @click="() => showBody = !showBody">
			<template v-if="showBody"><fa icon="angle-up"/></template>
			<template v-else><fa icon="angle-down"/></template>
		</button>
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
		},
		bodyTogglable: {
			type: Boolean,
			default: false
		},
	},
	inject: {
		inDeck: {
			default: false
		}
	},
	data() {
		return {
			showBody: true
		};
	}
});
</script>

<style lang="stylus" scoped>
.kedshtep
	overflow hidden

	&:not(.inDeck)
		background var(--face)
		box-shadow var(--shadow)
		border-radius var(--round)

		& + .kedshtep
			margin-top 16px

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
				box-shadow 0 var(--lineWidth) rgba(#000, 0.07)

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
				font-size 0.9em
				line-height 42px
				color var(--faceTextButton)

				&:hover
					color var(--faceTextButtonHover)

				&:active
					color var(--faceTextButtonActive)

	&.inDeck
		background var(--face)

		> header
			margin 0
			padding 8px 16px
			font-size 12px
			color var(--text)
			background var(--deckColumnBg)

			> button
				position absolute
				top 0
				right 8px
				padding 8px 6px
				font-size 14px
				color var(--text)

</style>
