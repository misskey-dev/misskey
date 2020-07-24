<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faPaintBrush"/> {{ $t('_pages.blocks.canvas') }}</template>

	<section style="padding: 0 16px 0 16px;">
		<mk-input v-model="value.name"><template #prefix><fa :icon="faMagic"/></template><span>{{ $t('_pages.blocks._canvas.id') }}</span></mk-input>
		<mk-input v-model="value.width" type="number"><span>{{ $t('_pages.blocks._canvas.width') }}</span><template #suffix>px</template></mk-input>
		<mk-input v-model="value.height" type="number"><span>{{ $t('_pages.blocks._canvas.height') }}</span><template #suffix>px</template></mk-input>
	</section>
</x-container>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPaintBrush, faMagic } from '@fortawesome/free-solid-svg-icons';
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
			faPaintBrush, faMagic
		};
	},

	created() {
		if (this.value.name == null) Vue.set(this.value, 'name', '');
		if (this.value.width == null) Vue.set(this.value, 'width', 300);
		if (this.value.height == null) Vue.set(this.value, 'height', 200);
	},
});
</script>
