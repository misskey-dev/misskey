<template>
<x-container @remove="() => $emit('remove')">
	<template #header><fa :icon="faBolt"/> {{ $t('blocks.input') }}</template>

	<section class="xfhsjczc">
		<input v-model="value.name" placeholder="Input name"/>
		<select v-model="value.inputType">
			<option value="string">String</option>
			<option value="number">Number</option>
		</select>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faBolt, faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import XContainer from './page-editor.container.vue';

export default Vue.extend({
	i18n: i18n('pages'),

	components: {
		XContainer
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
			faBolt, faPencilAlt
		};
	},

	created() {
		if (this.value.name == null) Vue.set(this.value, 'name', '');
		if (this.value.inputType == null) Vue.set(this.value, 'inputType', 'string');
	},
});
</script>

<style lang="stylus" scoped>
.xfhsjczc
	> input
		display block
		-webkit-appearance none
		-moz-appearance none
		appearance none
		width 100%
		min-width 100%
		border none
		box-shadow none
		padding 16px
		font-size 16px

</style>
