<template>
<MkSpacer :content-max="800">
	<XNotes ref="notes" :pagination="pagination"/>
</MkSpacer>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XNotes from '@/components/notes.vue';
import * as symbols from '@/symbols';

export default defineComponent({
	components: {
		XNotes
	},

	data() {
		return {
			[symbols.PAGE_INFO]: {
				title: this.$ts.featured,
				icon: 'fas fa-fire-alt',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'notes/featured',
				limit: 10,
				offsetMode: true,
			},
		};
	},
});
</script>
