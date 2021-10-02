<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><i class="fas fa-paper-plane"></i> {{ $ts._pages.blocks.post }}</template>

	<section style="padding: 16px;">
		<MkTextarea v-model="value.text"><template #label>{{ $ts._pages.blocks._post.text }}</template></MkTextarea>
		<MkSwitch v-model="value.attachCanvasImage"><span>{{ $ts._pages.blocks._post.attachCanvasImage }}</span></MkSwitch>
		<MkInput v-if="value.attachCanvasImage" v-model="value.canvasId"><template #label>{{ $ts._pages.blocks._post.canvasId }}</template></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@client/components/form/textarea.vue';
import MkInput from '@client/components/form/input.vue';
import MkSwitch from '@client/components/form/switch.vue';
import * as os from '@client/os';

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
		};
	},

	created() {
		if (this.value.text == null) this.value.text = '';
		if (this.value.attachCanvasImage == null) this.value.attachCanvasImage = false;
		if (this.value.canvasId == null) this.value.canvasId = '';
	},
});
</script>
