/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import pages_ from './pages.vue';
const meta = {
	title: 'pages/pages',
	component: pages_,
} satisfies Meta<typeof pages_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				pages_,
			},
			props: Object.keys(argTypes),
			template: '<pages_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof pages_>;
export default meta;
