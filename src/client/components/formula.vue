<template>
<x-formula :formula="formula" :block="block" />
</template>

<script lang="ts">
import Vue, { defineAsyncComponent } from 'vue';
export default Vue.extend({
	components: {
		XFormula: defineAsyncComponent(() => import('./formula-core.vue'))
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
