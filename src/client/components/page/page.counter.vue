<template>
<div>
	<MkButton class="llumlmnx" @click="click()">{{ hpml.interpolate(block.text) }}</MkButton>
</div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType } from 'vue';
import MkButton from '../ui/button.vue';
import * as os from '@/os';
import { CounterVarBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

export default defineComponent({
	components: {
		MkButton
	},
	props: {
		block: {
			type: Object as PropType<CounterVarBlock>,
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

		function click() {
			props.hpml.updatePageVar(props.block.name, value.value + (props.block.inc || 1));
			props.hpml.eval();
		}

		return {
			click
		};
	}
});
</script>

<style lang="scss" scoped>
.llumlmnx {
	display: inline-block;
	min-width: 300px;
	max-width: 450px;
	margin: 8px 0;
}
</style>
