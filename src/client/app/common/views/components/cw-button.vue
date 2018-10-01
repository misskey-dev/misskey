<template>
<button class="nrvgflfuaxwgkxoynpnumyookecqrrvh" @click="toggle">{{ value ? '%i18n:@hide%' : '%i18n:@show%' }}</button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		value: {
			type: Boolean,
			required: true
		}
	},

	methods: {
		toggle() {
			this.$emit('input', !this.value);
		}
	}
});
</script>

<style lang="stylus" scoped>
.nrvgflfuaxwgkxoynpnumyookecqrrvh
	display inline-block
	padding 4px 8px
	font-size 0.7em
	color var(--cwButtonFg)
	background var(--cwButtonBg)
	border-radius 2px
	cursor pointer
	user-select none

	&:hover
		background var(--cwButtonHoverBg)

</style>
