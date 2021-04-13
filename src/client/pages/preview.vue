<template>
<div class="graojtoi">
	<MkSample/>
</div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import MkSample from '@client/components/sample.vue';
import * as symbols from '@client/symbols';

export default defineComponent({
	components: {
		MkSample,
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.preview,
				icon: faEye,
			},
		}
	},
});
</script>

<style lang="scss" scoped>
.graojtoi {
	padding: var(--margin);
}
</style>
