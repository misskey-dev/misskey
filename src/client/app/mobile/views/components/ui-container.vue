<template>
<div class="ukygtjoj" :class="{ naked, inNakedDeckColumn, hideHeader: !showHeader, shadow: $store.state.device.useShadow }">
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
		}
	}
});
</script>

<style lang="stylus" scoped>
.ukygtjoj
	overflow hidden

	&:not(.inNakedDeckColumn)
		background var(--face)
		border-radius 8px

		&.shadow
			box-shadow 0 4px 16px rgba(#000, 0.1)

		& + .ukygtjoj
			margin-top 16px

			@media (max-width 500px)
				margin-top 8px

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

		> div
			color var(--text)

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
