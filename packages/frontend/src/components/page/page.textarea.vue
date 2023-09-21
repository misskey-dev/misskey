<template>
<MkTextarea :model-value="text" readonly></MkTextarea>
</template>

<script lang="ts">
import { TextBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';
import { defineComponent, PropType } from 'vue';
import MkTextarea from '../MkTextarea.vue';

export default defineComponent({
	components: {
		MkTextarea,
	},
	props: {
		block: {
			type: Object as PropType<TextBlock>,
			required: true,
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true,
		},
	},
	data() {
		return {
			text: this.hpml.interpolate(this.block.text),
		};
	},
	watch: {
		'hpml.vars': {
			handler() {
				this.text = this.hpml.interpolate(this.block.text);
			},
			deep: true,
		},
	},
});
</script>
