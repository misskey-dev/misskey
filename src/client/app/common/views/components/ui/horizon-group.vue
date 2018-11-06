<template>
<div class="pfzekjfwkwvadvlujpdnnxfggqgqjoze" :class="{ inputs }">
	<slot></slot>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	provide: {
		horizonGrouped: true
	},
	props: {
		inputs: {
			type: Boolean,
			required: false,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
.pfzekjfwkwvadvlujpdnnxfggqgqjoze
	display flex

	&.inputs
		margin 32px 0

	> *
		flex 1

		&:not(:last-child)
			margin-right 16px
</style>
