<template>
<x-container @remove="() => $emit('remove')">
	<template #header><fa :icon="faPaperPlane"/> {{ $t('blocks.post') }}</template>

	<section>
		<textarea v-model="value.text"></textarea>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
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
			faPaperPlane
		};
	},

	beforeCreate() {
		this.$options.components.XBlock = require('../page-editor.block.vue').default
	},

	created() {
		if (this.value.text == null) Vue.set(this.value, 'text', '');
	},
});
</script>
