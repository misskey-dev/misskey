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
root(isDark)
	display inline-block
	padding 4px 8px
	font-size 0.7em
	color isDark ? #393f4f : #fff
	background isDark ? #687390 : #b1b9c1
	border-radius 2px
	cursor pointer
	user-select none

	&:hover
		background isDark ? #707b97 : #bbc4ce

.nrvgflfuaxwgkxoynpnumyookecqrrvh[data-darkmode]
	root(true)

.nrvgflfuaxwgkxoynpnumyookecqrrvh:not([data-darkmode])
	root(false)

</style>
