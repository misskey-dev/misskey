<template>
<div>
	<x-textarea v-model="v">{{ script.interpolate(value.text) }}</x-textarea>
</div>
</template>

<script lang="ts">
import Vue from 'vue';
import XTextarea from '../ui/textarea.vue';

export default Vue.extend({
	components: {
		XTextarea
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
