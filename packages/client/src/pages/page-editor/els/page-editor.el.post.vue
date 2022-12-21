<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="ti ti-send"></i> {{ $ts._pages.blocks.post }}</template>

	<section style="padding: 16px;">
		<MkTextarea v-model="value.text"><template #label>{{ $ts._pages.blocks._post.text }}</template></MkTextarea>
		<MkSwitch v-model="value.attachCanvasImage"><span>{{ $ts._pages.blocks._post.attachCanvasImage }}</span></MkSwitch>
		<MkInput v-if="value.attachCanvasImage" v-model="value.canvasId"><template #label>{{ $ts._pages.blocks._post.canvasId }}</template></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkInput from '@/components/form/input.vue';
import MkSwitch from '@/components/form/switch.vue';

withDefaults(defineProps<{
	value: any
}>(), {
	value: {
		text: '',
		attachCanvasImage: false,
		canvasId: ''
	}
});
</script>
