<template>
<div class="hkcxmtwj">
	<x-switch v-model="v">{{ script.interpolate(value.text) }}</x-switch>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XSwitch from '../ui/switch.vue';

export default Vue.extend({
	components: {
		XSwitch
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
			v: this.value.default,
		};
	},
	watch: {
		v() {
			this.script.aiScript.updatePageVar(this.value.name, this.v);
			this.script.eval();
		}
	}
});
</script>

<style lang="scss" scoped>
.hkcxmtwj {
	display: inline-block;
	margin: 16px auto;

	& + .hkcxmtwj {
		margin-left: 16px;
	}
}
</style>
