/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import page_ from './page.vue';
const meta = {
	title: 'pages/page',
	component: page_,
} satisfies Meta<typeof page_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				page_,
			},
			props: Object.keys(argTypes),
			template: '<page_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof page_>;
export default meta;
