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
			return katex.renderToString(this.formula);
		}
	}
});
</script>

<style>
@import "../../../../../../node_modules/katex/dist/katex.min.css";
</style>
