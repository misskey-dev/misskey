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


root(isDark)
	display inline-block

	& + .nvemkhtwcnnpkdrwfcbzuwhfulejhmzg
		margin-left 12px

	> button
		display inline-block
		margin 0
		padding 12px 20px
		font-size 14px
		border 1px solid isDark ? #6d727d : #dcdfe6
		border-radius 4px
		outline none
		box-shadow none
		color isDark ? #fff : #606266
		transition 0.1s

		*
			pointer-events none

		&:hover
		&:focus
			color var(--primary)
			//background rgba(var(--primary-r), var(--primary-g), var(--primary-b), isDark ? 0.2 : 0.12)
			//border-color rgba(var(--primary-r), var(--primary-g), var(--primary-b), isDark ? 0.5 : 0.3)

		&:active
			color var(--primaryDarken20)
			//background rgba(var(--primary-r), var(--primary-g), var(--primary-b), 0.12)
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

.nvemkhtwcnnpkdrwfcbzuwhfulejhmzg[data-darkmode]
	root(true)

.nvemkhtwcnnpkdrwfcbzuwhfulejhmzg:not([data-darkmode])
	root(false)

</style>
