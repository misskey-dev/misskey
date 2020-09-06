<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faBolt"/> {{ $t('_pages.blocks.radioButton') }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<mk-input v-model:value="value.name"><template #prefix><fa :icon="faMagic"/></template><span>{{ $t('_pages.blocks._radioButton.name') }}</span></mk-input>
		<mk-input v-model:value="value.title"><span>{{ $t('_pages.blocks._radioButton.title') }}</span></mk-input>
		<mk-textarea v-model:value="values"><span>{{ $t('_pages.blocks._radioButton.values') }}</span></mk-textarea>
		<mk-input v-model:value="value.default"><span>{{ $t('_pages.blocks._radioButton.default') }}</span></mk-input>
	</section>
</x-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

export default defineComponent({
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
