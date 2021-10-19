<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
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

<script lang="ts">
import { defineComponent } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkInput from '@client/components/form/input.vue';
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
		};
	},

	created() {
		if (this.value.name == null) this.value.name = '';
		if (this.value.width == null) this.value.width = 300;
		if (this.value.height == null) this.value.height = 200;
	},
});
</script>
