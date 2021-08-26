<template>
<div>
	<MkInput class="kudkigyw" :model-value="value" @update:modelValue="updateValue($event)" type="number">
		<template #label>{{ hpml.interpolate(block.text) }}</template>
	</MkInput>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import MkInput from '../ui/input.vue';
import * as os from '@client/os';
import { Hpml } from '@client/scripts/hpml/evaluator';
import { NumberInputVarBlock } from '@client/scripts/hpml/block';

export default defineComponent({
	components: {
		MkInput
	},
	props: {
		block: {
			type: Object as PropType<NumberInputVarBlock>,
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

<style lang="scss" scoped>
.kudkigyw {
	display: inline-block;
	min-width: 300px;
	max-width: 450px;
	margin: 8px 0;
}
</style>
