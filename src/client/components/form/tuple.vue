<template>
<div class="wthhikgt _form_item" v-size="{ max: [500] }">
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
