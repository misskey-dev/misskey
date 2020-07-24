<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faBolt"/> {{ $t('_pages.blocks.numberInput') }}</template>

	<section style="padding: 0 16px 0 16px;">
		<mk-input v-model="value.name"><template #prefix><fa :icon="faMagic"/></template><span v-t="'_pages.blocks._numberInput.name'"></span></mk-input>
		<mk-input v-model="value.text"><span v-t="'_pages.blocks._numberInput.text'"></span></mk-input>
		<mk-input v-model="value.default" type="number"><span v-t="'_pages.blocks._numberInput.default'"></span></mk-input>
	</section>
</x-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '../../../components/ui/input.vue';

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
