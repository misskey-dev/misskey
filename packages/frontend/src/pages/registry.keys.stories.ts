/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import registry_keys from './registry.keys.vue';
const meta = {
	title: 'pages/registry.keys',
	component: registry_keys,
} satisfies Meta<typeof registry_keys>;
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
} satisfies StoryObj<typeof registry_keys>;
export default meta;
