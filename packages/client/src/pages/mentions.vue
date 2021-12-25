<template>
<MkSpacer :content-max="800">
	<XNotes :pagination="pagination"/>
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
				title: this.$ts.mentions,
				icon: 'fas fa-at',
				bg: 'var(--bg)',
			},
			pagination: {
				endpoint: 'notes/mentions',
				limit: 10,
			},
		};
	},
});
</script>
