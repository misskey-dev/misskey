/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import index_ from './index.vue';
const meta = {
	title: 'pages/user/index',
	component: index_,
} satisfies Meta<typeof index_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index_,
			},
			props: Object.keys(argTypes),
			template: '<index_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof index_>;
export default meta;
