<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.counter }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model="value.name">
			<template #prefix><i class="fas fa-magic"></i></template>
			<template #label>{{ $ts._pages.blocks._counter.name }}</template>
		</MkInput>
		<MkInput v-model="value.text">
			<template #label>{{ $ts._pages.blocks._counter.text }}</template>
		</MkInput>
		<MkInput v-model="value.inc" type="number">
			<template #label>{{ $ts._pages.blocks._counter.inc }}</template>
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
		name: ''
	}
});
</script>
