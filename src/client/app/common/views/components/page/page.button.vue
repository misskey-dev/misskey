<template>
<div>
	<ui-button class="kudkigyw" @click="click()" :primary="value.primary">{{ script.interpolate(value.text) }}</ui-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		value: {
			required: true
		},
		script: {
			required: true
		}
	},

	methods: {
		click() {
			if (this.value.action === 'dialog') {
				this.script.eval();
				this.$root.dialog({
					text: this.script.interpolate(this.value.content)
				});
			} else if (this.value.action === 'resetRandom') {
				this.script.aiScript.updateRandomSeed(Math.random());
				this.script.eval();
			} else if (this.value.action === 'pushEvent') {
				this.$root.api('page-push', {
					pageId: this.script.page.id,
					event: this.value.event,
					...(this.value.var ? {
						var: this.script.vars[this.value.var]
					} : {})
				});

				this.$root.dialog({
					type: 'success',
					text: this.script.interpolate(this.value.message)
				});
			}
		}
	}
});
</script>

<style lang="stylus" scoped>
.kudkigyw
	display inline-block
	min-width 200px
	max-width 450px
	margin 8px 0
</style>
