<template>
<div v-size="{ max: [500] }" v-sticky-container class="vrtktovh _formBlock">
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
.vrtktovh {
	margin: 0;
	border-top: solid 0.5px var(--divider);
	border-bottom: solid 0.5px var(--divider);
	padding: 24px 0;

	& + .vrtktovh {
		border-top: none;
	}

	&:first-child {
		border-top: none;
	}

	&:last-child {
		border-bottom: none;
	}

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
