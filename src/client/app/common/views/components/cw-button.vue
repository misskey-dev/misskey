<template>
<button class="nrvgflfuaxwgkxoynpnumyookecqrrvh" @click="toggle">
	<b>{{ value ? this.$t('hide') : this.$t('show') }}</b>
	<span v-if="!value">
		<span v-if="note.text">{{ this.$t('chars', { count: length(note.text) }) | number }}</span>
		<span v-if="note.text && note.files && note.files.length > 0"> / </span>
		<span v-if="note.files && note.files.length > 0">{{ this.$t('files', { count: note.files.length }) }}</span>
	</span>
</button>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../i18n';
import { length } from 'stringz';

export default Vue.extend({
	i18n: i18n('common/views/components/cw-button.vue'),

	props: {
		value: {
			type: Boolean,
			required: true
		},
		note: {
			type: Object,
			required: true
		}
	},

	methods: {
		length,

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

	> span
		margin-left 4px

		&:before
			content '('
		&:after
			content ')'

</style>
