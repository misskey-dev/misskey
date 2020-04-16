<template>
<div>
	<mk-button class="llumlmnx" @click="click()">{{ script.interpolate(value.text) }}</mk-button>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkButton from '../ui/button.vue';

export default Vue.extend({
	components: {
		MkButton
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
			this.script.aoiScript.updatePageVar(this.value.name, this.v);
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
