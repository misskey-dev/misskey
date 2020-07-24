<template>
<span class="mk-file-type-icon">
	<template v-if="kind == 'image'"><fa :icon="faFileImage"/></template>
</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { faFileImage } from '@fortawesome/free-solid-svg-icons';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		}
	},
	data() {
		return {
			faFileImage
		};
	},
	computed: {
		kind(): string {
			return this.type.split('/')[0];
		}
	}
});
</script>
