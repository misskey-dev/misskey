<template>
<x-container @remove="() => $emit('remove')">
	<template #header><fa :icon="faBolt"/> {{ $t('blocks.button') }}</template>

	<section class="xfhsjczc">
		<ui-input v-model="value.text"><span>{{ $t('blocks._button.text') }}</span></ui-input>
		<ui-select v-model="value.action">
			<template #label>{{ $t('blocks._button.action') }}</template>
			<option value="dialog">{{ $t('blocks._button._action.dialog') }}</option>
		</ui-select>
		<input v-model="value.props.content" placeholder="Dialog content"/>
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
		if (this.value.text == null) Vue.set(this.value, 'text', '');
		if (this.value.action == null) Vue.set(this.value, 'action', 'dialog');
		if (this.value.props == null) Vue.set(this.value, 'props', {});
	},
});
</script>

<style lang="stylus" scoped>
.xfhsjczc
	padding 0 16px 16px 16px

</style>
