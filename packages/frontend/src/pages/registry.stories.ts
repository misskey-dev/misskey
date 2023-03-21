/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import registry_ from './registry.vue';
const meta = {
	title: 'pages/registry',
	component: registry_,
} satisfies Meta<typeof registry_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				registry_,
			},
			props: Object.keys(argTypes),
			template: '<registry_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof registry_>;
export default meta;
