<template>
<x-formula :formula="formula" :block="block" />
</template>

<script lang="ts">
import { defineComponent } from 'vue';
export default defineComponent({
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
