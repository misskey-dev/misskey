<template>
<div>
	<div>{{ script.interpolate(value.title) }}</div>
	<mk-radio v-for="x in value.values" v-model="v" :value="x" :key="x">{{ x }}</mk-radio>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import MkRadio from '../ui/radio.vue';

export default Vue.extend({
	components: {
		MkRadio
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
			this.script.aoiScript.updatePageVar(this.value.name, this.v);
			this.script.eval();
		}
	}
});
</script>
