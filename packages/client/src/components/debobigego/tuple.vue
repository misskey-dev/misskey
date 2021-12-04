<template>
<div v-size="{ max: [500] }" class="wthhikgt _debobigegoItem">
	<slot></slot>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
});
</script>

<style lang="scss" scoped>
.wthhikgt {
	position: relative;
	display: flex;

	> ::v-deep(*) {
		flex: 1;
		margin: 0;

		&:not(:last-child) {
			margin-right: 16px;
		}
	}

	&.max-width_500px {
		display: block;

		> ::v-deep(*) {
			margin: inherit;
		}
	}
}
</style>
