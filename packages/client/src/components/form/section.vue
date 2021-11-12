<template>
<div class="vrtktovh" v-size="{ max: [500] }" v-sticky-container>
	<div class="label"><slot name="label"></slot></div>
	<div class="main">
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
	border-top: solid 0.5px var(--divider);

	> .label {
		font-weight: bold;
		padding: 24px 0 16px 0;
	}

	> .main {
		margin-bottom: 32px;
	}
}
</style>
