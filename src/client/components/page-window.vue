<template>
<XWindow ref="window" :width="400" :height="450" :no-padding="true" @close="$emit('done')" :with-ok-button="true" :ok-button-disabled="false" @ok="ok()" :can-close="false">
	<template #header>
		tesst
	</template>
	<component :is="component"/>
</XWindow>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import XWindow from './window.vue';
import * as os from '@/os';

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
