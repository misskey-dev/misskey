<template>
<div class="vrtktovg _form_item" v-size="{ max: [500] }">
	<div class="_form_label"><slot name="label"></slot></div>
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
.vrtktovg {
	> .main {
		> ::v-deep(*) {
			margin: 0;

			&:not(:first-child) {
				._form_panel {
					border-top: none;
					border-top-left-radius: 0;
					border-top-right-radius: 0;
				}
			}

			&:not(:last-child) {
				._form_panel {
					border-bottom: solid 1px var(--divider);
					border-bottom-left-radius: 0;
					border-bottom-right-radius: 0;
				}
			}
		}
	}
}
</style>
