<template>
<x-container @remove="() => $emit('remove')">
	<template #header><fa :icon="faBolt"/> {{ $t('blocks.button') }}</template>

	<section class="xfhsjczc">
		<ui-input v-model="value.text"><span>{{ $t('blocks._button.text') }}</span></ui-input>
		<ui-select v-model="value.action">
			<template #label>{{ $t('blocks._button.action') }}</template>
			<option value="dialog">{{ $t('blocks._button._action.dialog') }}</option>
			<option value="resetRandom">{{ $t('blocks._button._action.resetRandom') }}</option>
		</ui-select>
		<ui-input v-if="value.action === 'dialog'" v-model="value.content"><span>{{ $t('blocks._button._action._dialog.content') }}</span></ui-input>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import i18n from '../../../../i18n';
import { faBolt } from '@fortawesome/free-solid-svg-icons';
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
			faBolt
		};
	},

	created() {
		if (this.value.text == null) Vue.set(this.value, 'text', '');
		if (this.value.action == null) Vue.set(this.value, 'action', 'dialog');
		if (this.value.content == null) Vue.set(this.value, 'content', null);
	},
});
</script>

<style lang="stylus" scoped>
.xfhsjczc
	padding 0 16px 0 16px

</style>
