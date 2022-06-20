<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-paint-brush"></i> {{ $ts._pages.blocks.canvas }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model="value.name">
			<template #prefix><i class="fas fa-magic"></i></template>
			<template #label>{{ $ts._pages.blocks._canvas.id }}</template>
		</MkInput>
		<MkInput v-model="value.width" type="number">
			<template #label>{{ $ts._pages.blocks._canvas.width }}</template>
			<template #suffix>px</template>
		</MkInput>
		<MkInput v-model="value.height" type="number">
			<template #label>{{ $ts._pages.blocks._canvas.height }}</template>
			<template #suffix>px</template>
		</MkInput>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/form/input.vue';

withDefaults(defineProps<{
	value: any
}>(), {
	value: {
		name: '',
		width: 300,
		height: 200
	}
});
</script>
