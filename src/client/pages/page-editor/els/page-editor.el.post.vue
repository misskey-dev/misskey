<template>
<x-container @remove="() => $emit('remove')" :draggable="true">
	<template #header><fa :icon="faPaperPlane"/> {{ $t('_pages.blocks.post') }}</template>

	<section style="padding: 16px;">
		<mk-textarea v-model="value.text">{{ $t('_pages.blocks._post.text') }}</mk-textarea>
		<mk-switch v-model="value.attachCanvasImage"><span>{{ $t('_pages.blocks._post.attachCanvasImage') }}</span></mk-switch>
		<mk-input v-if="value.attachCanvasImage" v-model="value.canvasId"><span>{{ $t('_pages.blocks._post.canvasId') }}</span></mk-input>
	</section>
</x-container>
</template>

<script lang="ts">
import Vue from 'vue';
import { faPaperPlane } from '@fortawesome/free-regular-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '../../../components/ui/textarea.vue';
import MkInput from '../../../components/ui/input.vue';
import MkSwitch from '../../../components/ui/switch.vue';

export default Vue.extend({
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
		if (this.value.text == null) Vue.set(this.value, 'text', '');
		if (this.value.attachCanvasImage == null) Vue.set(this.value, 'attachCanvasImage', false);
		if (this.value.canvasId == null) Vue.set(this.value, 'canvasId', '');
	},
});
</script>
