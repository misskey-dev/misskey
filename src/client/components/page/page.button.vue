<template>
<div>
	<MkButton class="kudkigyw" @click="click()" :primary="block.primary">{{ hpml.interpolate(block.text) }}</MkButton>
</div>
</template>

<script lang="ts">
import { defineComponent, PropType, unref } from 'vue';
import MkButton from '../ui/button.vue';
import * as os from '@/os';
import { ButtonBlock } from '@/scripts/hpml/block';
import { Hpml } from '@/scripts/hpml/evaluator';

export default defineComponent({
	components: {
		MkButton
	},
	props: {
		block: {
			type: Object as PropType<ButtonBlock>,
			required: true
		},
		hpml: {
			type: Object as PropType<Hpml>,
			required: true
		}
	},
	methods: {
		click() {
			if (this.block.action === 'dialog') {
				this.hpml.eval();
				os.dialog({
					text: this.hpml.interpolate(this.block.content)
				});
			} else if (this.block.action === 'resetRandom') {
				this.hpml.updateRandomSeed(Math.random());
				this.hpml.eval();
			} else if (this.block.action === 'pushEvent') {
				os.api('page-push', {
					pageId: this.hpml.page.id,
					event: this.block.event,
					...(this.block.var ? {
						var: unref(this.hpml.vars)[this.block.var]
					} : {})
				});

				os.dialog({
					type: 'success',
					text: this.hpml.interpolate(this.block.message)
				});
			} else if (this.block.action === 'callAiScript') {
				this.hpml.callAiScript(this.block.fn);
			}
		}
	}
});
</script>

<style lang="scss" scoped>
.kudkigyw {
	display: inline-block;
	min-width: 200px;
	max-width: 450px;
	margin: 8px 0;
}
</style>
