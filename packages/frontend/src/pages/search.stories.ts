/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import search_ from './search.vue';
const meta = {
	title: 'pages/search',
	component: search_,
} satisfies Meta<typeof search_>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				search_,
			},
			props: Object.keys(argTypes),
			template: '<search_ v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof search_>;
export default meta;
