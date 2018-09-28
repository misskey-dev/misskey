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
.nvemkhtwcnnpkdrwfcbzuwhfulejhmzg
	display inline-block

	& + .nvemkhtwcnnpkdrwfcbzuwhfulejhmzg
		margin-left 12px

	> button
		display inline-block
		margin 0
		padding 12px 20px
		font-size 14px
		border 1px solid var(--formButtonBorder)
		border-radius 4px
		outline none
		box-shadow none
		color var(--text)
		transition 0.1s

		*
			pointer-events none

		&:hover
		&:focus
			color var(--primary)
			background var(--formButtonHoverBg)
			border-color var(--formButtonHoverBorder)

		&:active
			color var(--primaryDarken20)
			background var(--formButtonActiveBg)
			border-color var(--primary)
			transition all 0s

	&.primary
		> button
			border 1px solid var(--primary)
			background var(--primary)
			color var(--primaryForeground)

			&:hover
			&:focus
				background var(--primaryLighten20)
				border-color var(--primaryLighten20)

			&:active
				background var(--primaryDarken20)
				border-color var(--primaryDarken20)
				transition all 0s

	&.round
		> button
			border-radius 64px

</style>
