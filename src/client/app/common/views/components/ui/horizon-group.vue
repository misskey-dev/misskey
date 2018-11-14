<template>
<div class="vnxwkwuf" :class="{ inputs, noGrow }">
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
		},
		noGrow: {
			type: Boolean,
			required: false,
			default: false
		}
	}
});
</script>

<style lang="stylus" scoped>
.vnxwkwuf
	&.inputs
		margin 32px 0

	&:not(.noGrow)
		display flex

		> *
			flex 1

	> *:not(:last-child)
		margin-right 16px
</style>
