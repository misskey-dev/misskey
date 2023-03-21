/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable import/no-default-export */
import { Meta, StoryObj } from '@storybook/vue3';
import index_timeline from './index.timeline.vue';
const meta = {
	title: 'pages/user/index.timeline',
	component: index_timeline,
} satisfies Meta<typeof index_timeline>;
export const Default = {
	render(args, { argTypes }) {
		return {
			components: {
				index_timeline,
			},
			props: Object.keys(argTypes),
			template: '<index_timeline v-bind="$props" />',
		};
	},
	parameters: {
		layout: 'fullscreen',
	},
} satisfies StoryObj<typeof index_timeline>;
export default meta;
