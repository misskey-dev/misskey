/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import not_found from './not-found.vue';
const meta = {
	title: 'pages/not-found',
	component: not_found,
} satisfies Meta<typeof not_found>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				not_found,
			},
			props: Object.keys(argTypes),
			template: '<not_found v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof not_found>;
export default meta;
