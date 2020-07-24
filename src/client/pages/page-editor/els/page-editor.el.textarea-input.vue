<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faBolt"/> {{ $t('_pages.blocks.textareaInput') }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<mk-input v-model="value.name"><template #prefix><fa :icon="faMagic"/></template><span v-t="'_pages.blocks._textareaInput.name'"></span></mk-input>
		<mk-input v-model="value.text"><span v-t="'_pages.blocks._textareaInput.text'"></span></mk-input>
		<mk-textarea v-model="value.default"><span v-t="'_pages.blocks._textareaInput.default'"></span></mk-textarea>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '../../../components/ui/textarea.vue';
import MkInput from '../../../components/ui/input.vue';

export default Vue.extend({
	components: {
		XContainer, MkTextarea, MkInput
	},

	props: {
		value: {
			required: true
		},
	},

	data() {
		return {
			faBolt, faMagic
		};
	},

	created() {
		if (this.value.name == null) Vue.set(this.value, 'name', '');
	},
});
</script>
