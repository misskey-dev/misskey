<template>
<x-formula :formula="formula" :block="block" />
</template>

<script lang="ts">
import Vue from 'vue';
export default Vue.extend({
	components: {
		XFormula: () => import('./formula-core.vue').then(m => m.default)
	},
	props: {
		formula: {
			type: String,
			required: true
		},
		block: {
			type: Boolean,
			required: true
		}
	}
});
</script>
