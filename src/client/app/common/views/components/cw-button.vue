<template>
<button class="nrvgflfuaxwgkxoynpnumyookecqrrvh" @click="toggle">{{ value ? this.$t('hide') : this.$t('show') }}</button>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';

export default Vue.extend({
	i18n: i18n('common/views/components/cw-button.vue'),
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
