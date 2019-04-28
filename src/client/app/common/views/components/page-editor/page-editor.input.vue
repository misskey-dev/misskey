<template>
<x-container @remove="() => $emit('remove')">
	<template #header><fa :icon="faBolt"/> {{ $t('blocks.input') }}</template>

	<section class="dnvasjon">
		<ui-input v-model="value.name"><span>{{ $t('blocks._input.name') }}</span></ui-input>
		<ui-input v-model="value.text"><span>{{ $t('blocks._input.text') }}</span></ui-input>
		<ui-select v-model="value.inputType">
			<template #label>{{ $t('blocks._input.inputType') }}</template>
			<option value="string">{{ $t('blocks._input._inputType.string') }}</option>
			<option value="number">{{ $t('blocks._input._inputType.number') }}</option>
		</ui-select>
		<ui-input v-model="value.default" :type="value.inputType"><span>{{ $t('blocks._input.default') }}</span></ui-input>
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
.dnvasjon
	padding 0 16px 0 16px

</style>
