<template>
<div v-if="block" v-html="compiledFormula"></div>
<span v-else v-html="compiledFormula"></span>
</template>

<script lang="ts">
import Vue from 'vue';
import * as katex from 'katex';

export default Vue.extend({
	props: {
		formula: {
			type: String,
			required: true
		},
		block: {
			type: Boolean,
			required: true
		}
	},
	computed: {
		compiledFormula(): unknown {
			return katex.renderToString(this.formula, {
				throwOnError: false
			} as unknown);
		}
	}
});
</script>

<style>
@import "../../../../../../node_modules/katex/dist/katex.min.css";
</style>
