<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.switch }}</template>

	<section class="kjuadyyj">
		<MkInput v-model:value="value.name"><template #prefix><i class="fas fa-magic"></i></template><span>{{ $ts._pages.blocks._switch.name }}</span></MkInput>
		<MkInput v-model:value="value.text"><span>{{ $ts._pages.blocks._switch.text }}</span></MkInput>
		<MkSwitch v-model:value="value.default"><span>{{ $ts._pages.blocks._switch.default }}</span></MkSwitch>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faBolt, faMagic } from '@fortawesome/free-solid-svg-icons';
import XContainer from '../page-editor.container.vue';
import MkSwitch from '@client/components/ui/switch.vue';
import MkInput from '@client/components/ui/input.vue';
import * as os from '@client/os';

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
