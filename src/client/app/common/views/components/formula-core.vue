<template>
<span v-html="compiledFormula"></span>
</template>

<script lang="ts">
import Vue from 'vue';
import * as katex from 'katex';

export default Vue.extend({
	props: {
		formula: {
			type: String,
			required: true
		}
	},
	computed: {
		compiledFormula(): any {
			// let s: string;
			// try {
			// 	s = katex.renderToString(this.formula);
			// } catch(e) {
			// 	if ()
			// }
			// return s;
			return katex.renderToString(this.formula, {
				 throwOnError: false
			} as any);
		}
	}
});
</script>

<style>
@import "../../../../../../node_modules/katex/dist/katex.min.css";
</style>
