<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faBolt"/> {{ $ts._pages.blocks.radioButton }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<MkInput v-model:value="value.name"><template #prefix><Fa :icon="faMagic"/></template><span>{{ $ts._pages.blocks._radioButton.name }}</span></MkInput>
		<MkInput v-model:value="value.title"><span>{{ $ts._pages.blocks._radioButton.title }}</span></MkInput>
		<MkTextarea v-model:value="values"><span>{{ $ts._pages.blocks._radioButton.values }}</span></MkTextarea>
		<MkInput v-model:value="value.default"><span>{{ $ts._pages.blocks._radioButton.default }}</span></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkTextarea from '@client/components/ui/textarea.vue';
import MkInput from '@client/components/ui/input.vue';
import * as os from '@client/os';

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
			faBolt, faMagic
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
