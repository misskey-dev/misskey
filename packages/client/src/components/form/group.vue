<template>
<div v-sticky-container class="adfeebaf _formBlock">
	<div class="label"><slot name="label"></slot></div>
	<div class="main _formRoot">
		<slot></slot>
	</div>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
});
</script>

<style lang="scss" scoped>
.adfeebaf {
	padding: 24px 24px;
	border: solid 1px var(--divider);
	border-radius: var(--radius);

	> .label {
		font-weight: bold;
		padding: 0 0 16px 0;

		&:empty {
			display: none;
		}
	}

	> .main {

	}
}
</style>
