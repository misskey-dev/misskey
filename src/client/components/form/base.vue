<template>
<div class="rbusrurv" v-size="{ max: [370] }">
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
	line-height: 1.4em;
	padding: 32px;

	&.max-width_370px {
		padding: 32px 0;

		> ::v-deep(*) {
			._form_panel {
				border: solid 0.5px var(--divider);
				border-radius: 0;
				border-left: none;
				border-right: none;
			}
		}
	}
}
</style>
