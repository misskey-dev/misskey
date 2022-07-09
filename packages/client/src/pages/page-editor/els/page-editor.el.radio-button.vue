<template>
<!-- eslint-disable vue/no-mutating-props -->
<XContainer :draggable="true" @remove="() => $emit('remove')">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.radioButton }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<MkInput v-model="value.name"><template #prefix><i class="fas fa-magic"></i></template><template #label>{{ $ts._pages.blocks._radioButton.name }}</template></MkInput>
		<MkInput v-model="value.title"><template #label>{{ $ts._pages.blocks._radioButton.title }}</template></MkInput>
		<MkTextarea v-model="values"><template #label>{{ $ts._pages.blocks._radioButton.values }}</template></MkTextarea>
		<MkInput v-model="value.default"><template #label>{{ $ts._pages.blocks._radioButton.default }}</template></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts" setup>
/* eslint-disable vue/no-mutating-props */
import { watch } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkInput from '@/components/form/input.vue';

const props = withDefaults(defineProps<{
	value: any
}>(), {
	value: {
		name: '',
		title: '',
		values: []
	}
});

let values: string = $ref(props.value.values.join('\n'));

watch(values, () => {
	props.value.values = values.split('\n');
}, {
	deep: true
});
</script>
