<template>
<XWindow ref="window" :initial-width="400" :initial-height="450" :can-resize="true">
	<template #header>
		tesst
	</template>
	<div style="height: 100%; background: var(--bg);">
		<component :is="component"/>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';

export default defineComponent({
	components: {
		XWindow,
	},

	props: {
		component: {
			type: Object,
			required: true,
		},
	},
});
</script>
