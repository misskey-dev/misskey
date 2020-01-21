<template>
<div>
	<div>{{ script.interpolate(value.title) }}</div>
	<x-radio v-for="x in value.values" v-model="v" :value="x" :key="x">{{ x }}</x-radio>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XRadio from '../ui/radio.vue';

export default Vue.extend({
	components: {
		XRadio
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
