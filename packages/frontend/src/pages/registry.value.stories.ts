import { Meta, Story } from '@storybook/vue3';
import registry_value from './registry.value.vue';
const meta = {
	title: 'pages/registry.value',
	component: registry_value,
};
export const Default = {
	components: {
		registry_value,
	},
	template: '<registry.value />',
};
export default meta;
