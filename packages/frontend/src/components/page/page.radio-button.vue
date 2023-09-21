<template>
<div>
	<div>{{ hpml.interpolate(block.title) }}</div>
	<MkRadio v-for="item in block.values" :key="item" :modelValue="value" :value="item" @update:model-value="updateValue($event)">{{ item }}</MkRadio>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import MkRadio from '../MkRadio.vue';
import { Hpml } from '@/scripts/hpml/evaluator';
import { RadioButtonVarBlock } from '@/scripts/hpml/block';

export default defineComponent({
	components: {
		MkRadio,
	},
	props: {
		block: {
			type: Object as PropType<RadioButtonVarBlock>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
	},
	setup(props, ctx) {
		const value = computed(() => {
			return props.hpml.vars.value[props.block.name];
		});

		function updateValue(newValue: string) {
			props.hpml.updatePageVar(props.block.name, newValue);
			props.hpml.eval();
		}

		return {
			value,
			updateValue,
		};
	},
});
</script>
