<template>
<MkFormulaCore :formula="formula" :block="block"/>
</template>

<script lang="ts" setup>
import MkFormulaCore from './MkFormulaCore.vue';
defineProps({
	formula: {
		type: String,
		required: true,
	},
	block: {
		type: Boolean,
		required: true,
	},
});
</script>
