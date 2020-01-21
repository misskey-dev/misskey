<template>
<div>
	<x-button class="llumlmnx" @click="click()">{{ script.interpolate(value.text) }}</x-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XButton from '../ui/button.vue';

export default Vue.extend({
	components: {
		XButton
	},
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

<style lang="scss" scoped>
.llumlmnx {
	display: inline-block;
	min-width: 300px;
	max-width: 450px;
	margin: 8px 0;
}
</style>
