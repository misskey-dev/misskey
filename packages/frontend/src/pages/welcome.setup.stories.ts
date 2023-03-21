/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import welcome_setup from './welcome.setup.vue';
const meta = {
	title: 'pages/welcome.setup',
	component: welcome_setup,
} satisfies Meta<typeof welcome_setup>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				welcome_setup,
			},
			props: Object.keys(argTypes),
			template: '<welcome_setup v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof welcome_setup>;
export default meta;
