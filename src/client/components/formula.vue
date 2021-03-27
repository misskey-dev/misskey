<template>
<XFormula :formula="formula" :block="block" />
</template>

<script lang="ts">
import { defineComponent, defineAsyncComponent } from 'vue';import * as os from '@client/os';

export default defineComponent({
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
