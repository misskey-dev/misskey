<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faPaperPlane"/> {{ $t('_pages.blocks.post') }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<mk-textarea v-model="value.text">{{ $t('_pages.blocks._post.text') }}</mk-textarea>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import i18n from '../../../i18n';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '../../../components/ui/textarea.vue';

export default Vue.extend({
	i18n,

	components: {
		XContainer, MkTextarea
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

	created() {
		if (this.value.text == null) Vue.set(this.value, 'text', '');
	},
});
</script>
