<template>
<div class="ui-card" :class="{ shadow: $store.state.device.useShadow }">
	<header>
		<slot name="title"></slot>
	</header>

	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	provide() {
		return {
			isCardChild: true
		};
	}
});
</script>

<style lang="stylus" scoped>
.ui-card
	margin 16px
	max-width 850px
	color var(--faceText)
	background var(--face)
	border-radius var(--round)

	&.shadow
		box-shadow 0 3px 1px -2px rgba(#000, 0.2), 0 2px 2px 0 rgba(#000, 0.14), 0 1px 5px 0 rgba(#000, 0.12)

	> header
		padding 16px
		font-weight bold
		font-size 20px
		color var(--faceText)

		@media (min-width 500px)
			padding 24px 32px

	> section
		padding 20px 16px
		border-top solid var(--lineWidth) var(--faceDivider)

		@media (min-width 500px)
			padding 32px

		&.fit-top
			padding-top 0

		&.fit-bottom
			padding-bottom 0

		> header
			margin-bottom 16px
			font-weight bold
			color var(--faceText)
</style>
