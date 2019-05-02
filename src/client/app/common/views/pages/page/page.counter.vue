<template>
<div>
	<ui-button class="llumlmnx" @click="click()">{{ script.interpolate(value.text) }}</ui-button>
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

	data() {
		return {
			v: 0,
		};
	},

	watch: {
		v() {
			this.script.aiScript.updatePageVar(this.value.name, this.v);
			this.script.eval();
		}
	},

	methods: {
		click() {
			this.v = this.v + (this.value.inc || 1);
		}
	}
});
</script>

<style lang="stylus" scoped>
.llumlmnx
	display inline-block
	min-width 300px
	max-width 450px
	margin 8px 0
</style>
