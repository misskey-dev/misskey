<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faBolt"/> {{ $t('blocks.radioButton') }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<ui-input v-model="value.name"><template #prefix><fa :icon="faMagic"/></template><span>{{ $t('blocks._radioButton.name') }}</span></ui-input>
		<ui-input v-model="value.title"><span>{{ $t('blocks._radioButton.title') }}</span></ui-input>
		<ui-textarea v-model="values"><span>{{ $t('blocks._radioButton.values') }}</span></ui-textarea>
		<ui-input v-model="value.default"><span>{{ $t('blocks._radioButton.default') }}</span></ui-input>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import i18n from '../../../../../i18n';
import XContainer from '../page-editor.container.vue';

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
			values: '',
			faBolt, faMagic
		};
	},

	watch: {
		values() {
			Vue.set(this.value, 'values', this.values.split('\n'));
		}
	},

	created() {
		if (this.value.name == null) Vue.set(this.value, 'name', '');
		if (this.value.title == null) Vue.set(this.value, 'title', '');
		if (this.value.values == null) Vue.set(this.value, 'values', []);
		this.values = this.value.values.join('\n');
	},
});
</script>
