<template>
<div>
	<div>{{ hpml.interpolate(block.title) }}</div>
	<MkRadio v-for="item in block.values" :modelValue="value" @update:modelValue="updateValue($event)" :value="item" :key="item">{{ item }}</MkRadio>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import MkRadio from '../form/radio.vue';
import * as os from '@client/os';
import { Hpml } from '@client/scripts/hpml/evaluator';
import { RadioButtonVarBlock } from '@client/scripts/hpml/block';

export default defineComponent({
	components: {
		MkRadio
	},
	props: {
		block: {
			type: Object as PropType<RadioButtonVarBlock>,
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

		function updateValue(newValue: string) {
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
