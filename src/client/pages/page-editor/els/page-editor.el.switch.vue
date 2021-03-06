<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><Fa :icon="faBolt"/> {{ $ts._pages.blocks.switch }}</template>

	<section class="kjuadyyj">
		<MkInput v-model:value="value.name"><template #prefix><Fa :icon="faMagic"/></template><span>{{ $ts._pages.blocks._switch.name }}</span></MkInput>
		<MkInput v-model:value="value.text"><span>{{ $ts._pages.blocks._switch.text }}</span></MkInput>
		<MkSwitch v-model:value="value.default"><span>{{ $ts._pages.blocks._switch.default }}</span></MkSwitch>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkSwitch from '@/components/ui/switch.vue';
import MkInput from '@/components/ui/input.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		XContainer, MkSwitch, MkInput
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

<style lang="scss" scoped>
.kjuadyyj {
	padding: 0 16px 16px 16px;
}
</style>
