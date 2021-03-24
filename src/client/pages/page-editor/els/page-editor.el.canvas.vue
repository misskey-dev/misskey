<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faPaintBrush"/> {{ $ts._pages.blocks.canvas }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model:value="value.name"><template #prefix><Fa :icon="faMagic"/></template><span>{{ $ts._pages.blocks._canvas.id }}</span></MkInput>
		<MkInput v-model:value="value.width" type="number"><span>{{ $ts._pages.blocks._canvas.width }}</span><template #suffix>px</template></MkInput>
		<MkInput v-model:value="value.height" type="number"><span>{{ $ts._pages.blocks._canvas.height }}</span><template #suffix>px</template></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPaintBrush, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '@client/components/ui/input.vue';
import * as os from '@client/os';

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
		if (this.value.name == null) this.value.name = '';
		if (this.value.width == null) this.value.width = 300;
		if (this.value.height == null) this.value.height = 200;
	},
});
</script>
