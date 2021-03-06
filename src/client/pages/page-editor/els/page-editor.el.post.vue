<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faPaperPlane"/> {{ $ts._pages.blocks.post }}</template>

	<section style="padding: 16px;">
		<MkTextarea v-model:value="value.text">{{ $ts._pages.blocks._post.text }}</MkTextarea>
		<MkSwitch v-model:value="value.attachCanvasImage"><span>{{ $ts._pages.blocks._post.attachCanvasImage }}</span></MkSwitch>
		<MkInput v-if="value.attachCanvasImage" v-model:value="value.canvasId"><span>{{ $ts._pages.blocks._post.canvasId }}</span></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@/components/ui/textarea.vue';
import MkInput from '@/components/ui/input.vue';
import MkSwitch from '@/components/ui/switch.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkTextarea, MkInput, MkSwitch
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
		if (this.value.text == null) this.value.text = '';
		if (this.value.attachCanvasImage == null) this.value.attachCanvasImage = false;
		if (this.value.canvasId == null) this.value.canvasId = '';
	},
});
</script>
