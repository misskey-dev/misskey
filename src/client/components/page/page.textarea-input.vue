<template>
<div>
	<MkTextarea :model-value="value" @update:modelValue="updateValue($event)">
		<template #label>{{ hpml.interpolate(block.text) }}</template>
	</MkTextarea>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import MkTextarea from '../ui/textarea.vue';
import * as os from '@client/os';
import { Hpml } from '@client/scripts/hpml/evaluator';
import { HpmlTextInput } from '@client/scripts/hpml';
import { TextInputVarBlock } from '@client/scripts/hpml/block';

export default defineComponent({
	components: {
		MkTextarea
	},
	props: {
		block: {
			type: Object as PropType<TextInputVarBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		}
	},
	setup(props, ctx) {
		const value = computed(() => {
			return props.hpml.vars.value[props.block.name];
		});

		function updateValue(newValue) {
			props.hpml.updatePageVar(props.block.name, newValue);
			props.hpml.eval();
		}

		return {
			value,
			updateValue
		};
	}
});
</script>
