<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faBolt"/> {{ $t('_pages.blocks.textInput') }}</template>

	<section style="padding: 0 16px 0 16px;">
		<mk-input v-model:value="value.name"><template #prefix><fa :icon="faMagic"/></template><span>{{ $t('_pages.blocks._textInput.name') }}</span></mk-input>
		<mk-input v-model:value="value.text"><span>{{ $t('_pages.blocks._textInput.text') }}</span></mk-input>
		<mk-input v-model:value="value.default" type="text"><span>{{ $t('_pages.blocks._textInput.default') }}</span></mk-input>
	</section>
</x-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkInput
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
