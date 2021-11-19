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

<script lang="ts">
/* eslint-disable vue/no-mutating-props */
import { defineComponent } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@/components/form/textarea.vue';
import MkInput from '@/components/form/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkTextarea, MkInput
	},
	props: {
		value: {
			required: true
		},
	},
	data() {
		return {
			values: '',
		};
	},
	watch: {
		values: {
			handler() {
				this.value.values = this.values.split('\n');
			},
			deep: true
		}
	},
	created() {
		if (this.value.name == null) this.value.name = '';
		if (this.value.title == null) this.value.title = '';
		if (this.value.values == null) this.value.values = [];
		this.values = this.value.values.join('\n');
	},
});
</script>
