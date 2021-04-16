<template>
<div class="vrtktovg _formItem" v-size="{ max: [500] }" v-sticky-container>
	<div class="_formLabel"><slot name="label"></slot></div>
	<div class="main _form_group">
		<slot></slot>
	</div>
	<div class="_formCaption"><slot name="caption"></slot></div>
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

			&:not(:last-child) {
				&._formPanel, ._formPanel {
					border-bottom: solid 0.5px var(--divider);
					border-bottom-left-radius: 0;
					border-bottom-right-radius: 0;
				}
			}
			
			&:not(:first-child) {
				&._formPanel, ._formPanel {
					border-top: none;
					border-top-left-radius: 0;
					border-top-right-radius: 0;
				}
			}
		}
	}
}
</style>
