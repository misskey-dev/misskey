<template>
<div>
	<MkInput class="kudkigyw" :value="value" @update:value="updateValue($event)" type="text">{{ hpml.interpolate(block.text) }}</MkInput>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import MkInput from '../ui/input.vue';
import * as os from '@/os';
import { Hpml } from '@/scripts/hpml/evaluator';
import { TextInputVarBlock } from '@/scripts/hpml/block';

export default defineComponent({
	components: {
		MkInput
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

		// TODO: イベントではなく直接書き換えるようにする
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
