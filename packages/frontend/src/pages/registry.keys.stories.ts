import { Meta, Story } from '@storybook/vue3';
import registry_keys from './registry.keys.vue';
const meta = {
	title: 'pages/registry.keys',
	component: registry_keys,
};
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				registry_keys,
			},
			props: Object.keys(argTypes),
			template: '<registry_keys v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
};
export default meta;
