<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faBolt"/> {{ $t('_pages.blocks.textInput') }}</template>

	<section style="padding: 0 16px 0 16px;">
		<MkInput v-model:value="value.name"><template #prefix><Fa :icon="faMagic"/></template><span>{{ $t('_pages.blocks._textInput.name') }}</span></MkInput>
		<MkInput v-model:value="value.text"><span>{{ $t('_pages.blocks._textInput.text') }}</span></MkInput>
		<MkInput v-model:value="value.default" type="text"><span>{{ $t('_pages.blocks._textInput.default') }}</span></MkInput>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

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
