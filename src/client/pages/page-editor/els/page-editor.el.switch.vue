<template>
<XContainer @remove="() => $emit('remove')" :draggable="true">
	<template #header><i class="fas fa-bolt"></i> {{ $ts._pages.blocks.switch }}</template>

	<section class="kjuadyyj">
		<MkInput v-model="value.name"><template #prefix><i class="fas fa-magic"></i></template><template #label>{{ $ts._pages.blocks._switch.name }}</template></MkInput>
		<MkInput v-model="value.text"><template #label>{{ $ts._pages.blocks._switch.text }}</template></MkInput>
		<MkSwitch v-model="value.default"><span>{{ $ts._pages.blocks._switch.default }}</span></MkSwitch>
	</section>
</XContainer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XContainer from '../page-editor.container.vue';
import MkSwitch from '@client/components/form/switch.vue';
import MkInput from '@client/components/form/input.vue';
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
