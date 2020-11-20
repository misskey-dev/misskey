<template>
<div class="rbusrurv" v-size="{ max: [500] }">
	<slot></slot>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
});
</script>

<style lang="scss" scoped>
.rbusrurv {
	padding: 32px;

	&.max-width_500px {
		padding: 32px 0;

		> ::v-deep(*) {
			._form_panel {
				border: solid 1px var(--divider);
				border-radius: 0;
				border-left: none;
				border-right: none;
			}
		}
	}
}
</style>
