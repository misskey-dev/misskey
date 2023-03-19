import { Meta, Story } from '@storybook/vue3';
import registry_keys from './registry.keys.vue';
const meta = {
	title: 'pages/registry.keys',
	component: registry_keys,
};
export const Default = {
	components: {
		registry_keys,
	},
	template: '<registry_keys />',
};
export default meta;
