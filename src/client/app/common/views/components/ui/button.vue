<template>
<div class="ui-button" :class="[styl]">
	<button :type="type" @click="$emit('click')">
		<slot></slot>
	</button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	props: {
		type: {
			type: String,
			required: false
		}
	},
	data() {
		return {
			styl: 'fill'
		};
	},
	inject: {
		isCardChild: { default: false }
	},
	created() {
		if (this.isCardChild) {
			this.styl = 'line';
		}
	}
});
</script>

<style lang="stylus" scoped>
root(fill)
	> button
		display block
		width 100%
		margin 0
		padding 0
		font-weight bold
		font-size 16px
		line-height 44px
		border none
		border-radius 6px
		outline none
		box-shadow none

		if fill
			color var(--primaryForeground)
			background var(--primary)

			&:hover
				background var(--primaryLighten5)

			&:active
				background var(--primaryDarken5)
		else
			color var(--primary)
			background none

			&:hover
				color var(--primaryDarken5)

			&:active
				background var(--primaryAlpha03)

.ui-button
	&.fill
		root(true)
	&:not(.fill)
		root(false)

</style>
