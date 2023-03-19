import { Meta, Story } from '@storybook/vue3';
import registry from './registry.vue';
const meta = {
	title: 'pages/registry',
	component: registry,
};
export const Default = {
	components: {
		registry,
	},
	template: '<registry />',
};
export default meta;
