<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.textareaInput }}</template>

	<section style="padding: 0 16px 16px 16px;">
		<MkInput v-model:value="value.name"><template #prefix><i class="fas fa-magic"></i></template><span>{{ $ts._pages.blocks._textareaInput.name }}</span></MkInput>
		<MkInput v-model:value="value.text"><span>{{ $ts._pages.blocks._textareaInput.text }}</span></MkInput>
		<MkTextarea v-model:value="value.default"><span>{{ $ts._pages.blocks._textareaInput.default }}</span></MkTextarea>
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
			faBolt, faMagic
		};
	},

	created() {
		if (this.value.name == null) this.value.name = '';
	},
});
</script>
