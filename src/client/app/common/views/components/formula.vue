<template>
<span v-html="compiledFormula"></span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
	props: {
		formula: {
			type: String,
			required: true
		}
	},
	data() {
		return {
			compiledFormula: null
		};
	},
	async created() {
		const katex = await import('katex').then(m => m.default);
		this.compiledFormula = katex.renderToString(this.formula);
	}
});
</script>

<style>
@import "../../../../../../node_modules/katex/dist/katex.min.css";
</style>
