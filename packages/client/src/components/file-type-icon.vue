<template>
<span class="mk-file-type-icon">
	<template v-if="kind == 'image'"><i class="fas fa-file-image"></i></template>
</span>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import * as os from '@/os';

export default defineComponent({
	props: {
		type: {
			type: String,
			required: true,
		}
	},
	data() {
		return {
		};
	},
	computed: {
		kind(): string {
			return this.type.split('/')[0];
		}
	}
});
</script>
