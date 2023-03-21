/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import preview_ from './preview.vue';
const meta = {
	title: 'pages/preview',
	component: preview_,
} satisfies Meta<typeof preview_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				preview_,
			},
			props: Object.keys(argTypes),
			template: '<preview_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof preview_>;
export default meta;
