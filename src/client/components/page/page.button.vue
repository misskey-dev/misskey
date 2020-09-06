<template>
<div>
	<mk-button class="kudkigyw" @click="click()" :primary="value.primary">{{ hpml.interpolate(value.text) }}</mk-button>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MkButton from '../ui/button.vue';
import * as os from '@/os';

export default defineComponent({
	components: {
		MkButton
	},
	props: {
		value: {
			required: true
		},
		hpml: {
			required: true
		}
	},
	methods: {
		click() {
			if (this.value.action === 'dialog') {
				this.hpml.eval();
				os.dialog({
					text: this.hpml.interpolate(this.value.content)
				});
			} else if (this.value.action === 'resetRandom') {
				this.hpml.updateRandomSeed(Math.random());
				this.hpml.eval();
			} else if (this.value.action === 'pushEvent') {
				os.api('page-push', {
					pageId: this.hpml.page.id,
					event: this.value.event,
					...(this.value.var ? {
						var: this.hpml.vars[this.value.var]
					} : {})
				});

				os.dialog({
					type: 'success',
					text: this.hpml.interpolate(this.value.message)
				});
			} else if (this.value.action === 'callAiScript') {
				this.hpml.callAiScript(this.value.fn);
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
