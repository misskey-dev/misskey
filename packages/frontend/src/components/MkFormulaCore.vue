<!-- eslint-disable vue/no-v-html -->
<template>
<div v-if="block" v-html="compiledFormula"></div>
<span v-else v-html="compiledFormula"></span>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import katex from 'katex';
const props = defineProps({
	formula: {
		type: String,
		required: true,
	},
	block: {
		type: Boolean,
		required: true,
	},
});
const compiledFormula = computed(() =>
	katex.renderToString(props.formula, {
		throwOnError: false,
		strict: false,
	}),
);
</script>

<style>
@import "../../node_modules/katex/dist/katex.min.css";
</style>
