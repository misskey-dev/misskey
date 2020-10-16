<template>
<XWindow ref="window" :initial-width="400" :initial-height="450" :can-resize="true">
	<template #header>
		tesst
	</template>
	<div style="min-height: 100%; background: var(--bg);">
		<component :is="component" v-bind="props"/>
	</div>
</XWindow>
</template>

<script lang="ts">
import { defineComponent, markRaw } from 'vue';
import XWindow from '@/components/ui/window.vue';

export default defineComponent({
	components: {
		XWindow,
	},

	props: {
		initialComponent: {
			type: Object,
			required: true,
		},
		initialProps: {
			type: Object,
			required: false,
			default: {},
		},
	},

	data() {
		return {
			component: this.initialComponent,
			props: this.initialProps,
		};
	},

	provide() {
		return {
			navHook: (component, props) => {
				this.component = markRaw(component);
				this.props = props;
				console.log(component, props);
			}
		};
	},
});
</script>
