<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.numberInput }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model:value="value.name"><template #prefix><i class="fas fa-magic"></i></template><span>{{ $ts._pages.blocks._numberInput.name }}</span></MkInput>
		<MkInput v-model:value="value.text"><span>{{ $ts._pages.blocks._numberInput.text }}</span></MkInput>
		<MkInput v-model:value="value.default" type="number"><span>{{ $ts._pages.blocks._numberInput.default }}</span></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '@client/components/ui/input.vue';
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
			faBolt, faMagic
		};
	},

	created() {
		if (this.value.name == null) this.value.name = '';
	},
});
</script>
