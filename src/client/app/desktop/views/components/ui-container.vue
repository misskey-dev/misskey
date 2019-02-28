<template>
<div class="kedshtep" :class="{ naked, inNakedDeckColumn, shadow: $store.state.device.useShadow, round: $store.state.device.roundedCorners }">
	<header v-if="showHeader">
		<div class="title"><slot name="header"></slot></div>
		<slot name="func"></slot>
		<button v-if="bodyTogglable" @click="toggleContent(!showBody)">
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
		expanded: {
			type: Boolean,
			default: true
		},
	},
	inject: {
		inNakedDeckColumn: {
			default: false
		}
	},
	data() {
		return {
			showBody: this.expanded
		};
	},
	methods: {
		toggleContent(show: boolean) {
			this.showBody = show;
			this.$emit('toggle', show);
		}
	}
});
</script>

<style lang="stylus" scoped>
.kedshtep
	overflow hidden

	&:not(.inNakedDeckColumn)
		background var(--face)

		&.round
			border-radius 6px

		&.shadow
			box-shadow 0 3px 8px rgba(0, 0, 0, 0.2)

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

	&.inNakedDeckColumn
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
