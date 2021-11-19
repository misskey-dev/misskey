<template>
<div v-show="hpml.vars.value[block.var]">
	<XBlock v-for="child in block.children" :key="child.id" :block="child" :hpml="hpml" :h="h"/>
</div>
</template>

<script lang="ts">
import { IfBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';
import { defineComponent, defineAsyncComponent, PropType } from 'vue';

export default defineComponent({
	components: {
		XBlock: defineAsyncComponent(() => import('./page.block.vue'))
	},
	props: {
		block: {
			type: Object as PropType<IfBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		},
		h: {
			type: Number,
			required: true
		}
	},
});
</script>
